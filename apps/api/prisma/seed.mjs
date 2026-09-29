import process from 'node:process';
import pg from 'pg';

const { Client } = pg;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  await client.connect();
  try {
    await client.query('BEGIN');
    const profileResult = await client.query(
      'SELECT id FROM user_profiles WHERE lower(email) = lower($1)',
      [process.env.DEV_ADMIN_EMAIL],
    );

    if (profileResult.rowCount === 0) {
      await client.query('ROLLBACK');
      console.log('Seed de demonstração ignorado: faça login como administrador para criar o perfil local.');
      return;
    }

    const ownerId = profileResult.rows[0].id;
    const categoryTitles = ['Casa', 'Estudo', 'Livros', 'Trabalho', 'Projetos', 'Planejamento'];
    const categoryIds = new Map();

    for (const title of categoryTitles) {
      const existing = await client.query(
        'SELECT id FROM categories WHERE "ownerId" = $1 AND title = $2 AND "deletedAt" IS NULL LIMIT 1',
        [ownerId, title],
      );
      const result = existing.rowCount > 0
        ? existing
        : await client.query(
            'INSERT INTO categories (title, "ownerId", "updatedAt") VALUES ($1, $2, NOW()) RETURNING id',
            [title, ownerId],
          );
      categoryIds.set(title, result.rows[0].id);
    }

    const sampleTasks = [
      ['Projetos', 'Definir etapas do próximo projeto', 'Dividir o projeto em entregas menores.'],
      ['Projetos', 'Revisar referências visuais', 'Separar exemplos para orientar a implementação.'],
      ['Projetos', 'Preparar primeira versão', 'Montar uma versão inicial para validação.'],
      ['Projetos', 'Coletar feedback', 'Anotar melhorias sugeridas durante a revisão.'],
      ['Projetos', 'Publicar atualização', 'Conferir os últimos detalhes antes de publicar.'],
      ['Casa', 'Organizar a mesa de trabalho', 'Deixar os itens mais usados ao alcance.'],
      ['Casa', 'Planejar compras da semana', 'Revisar o que está faltando em casa.'],
      ['Estudo', 'Revisar anotações da semana', 'Consolidar os principais pontos estudados.'],
      ['Estudo', 'Resolver exercícios pendentes', 'Praticar os tópicos vistos recentemente.'],
      ['Livros', 'Escolher a próxima leitura', 'Selecionar um título da lista de leitura.'],
      ['Livros', 'Atualizar notas de leitura', 'Registrar ideias importantes do livro atual.'],
      ['Trabalho', 'Revisar prioridades da equipe', 'Confirmar as entregas mais importantes.'],
      ['Trabalho', 'Preparar pauta da reunião', 'Reunir tópicos e decisões pendentes.'],
      ['Planejamento', 'Organizar compromissos da semana', 'Conferir prazos e horários no calendário.'],
      ['Planejamento', 'Definir foco para amanhã', 'Escolher a principal tarefa do próximo dia.'],
    ];

    let createdTasks = 0;
    for (const [categoryTitle, title, description] of sampleTasks) {
      const categoryId = categoryIds.get(categoryTitle);
      const existing = await client.query(
        'SELECT id FROM tasks WHERE "ownerId" = $1 AND "categoryId" = $2 AND title = $3 AND "deletedAt" IS NULL LIMIT 1',
        [ownerId, categoryId, title],
      );

      if (existing.rowCount === 0) {
        await client.query(
          'INSERT INTO tasks (title, description, "ownerId", "categoryId", "updatedAt") VALUES ($1, $2, $3, $4, NOW())',
          [title, description, ownerId, categoryId],
        );
        createdTasks += 1;
      }
    }

    await client.query('COMMIT');
    console.log(`Seed concluído: ${categoryTitles.length} categorias disponíveis e ${createdTasks} tarefas novas.`);
    console.log(`Usuário administrador provisionado no Keycloak: ${process.env.DEV_ADMIN_EMAIL}`);
    console.log(`Usuário comum provisionado no Keycloak: ${process.env.DEV_USER_EMAIL}`);
    console.log('Perfis locais são sincronizados no primeiro login pelo BFF.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
