import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ListCategoryDto } from './dto/list-category.dto';
import { CategoryDto } from './dto/category.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, createCategoryDto: CreateCategoryDto): Promise<CategoryDto> {
    const category = await this.prisma.category.create({
      data: {
        ...createCategoryDto,
        ownerId,
      },
    });
    return new CategoryDto(category);
  }

  async findAll(ownerId: string, listCategoryDto: ListCategoryDto): Promise<PaginatedResponseDto<CategoryDto>> {
    const { page = 1, pageSize = 20, title } = listCategoryDto;

    const where = {
      ownerId,
      deletedAt: null,
      ...(title && { title: { contains: title, mode: Prisma.QueryMode.insensitive } }),
    };

    const [categories, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          title: 'asc',
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return new PaginatedResponseDto(
      categories.map(category => new CategoryDto(category)),
      total,
      page,
      pageSize,
    );
  }

  async findOne(ownerId: string, id: string): Promise<CategoryDto> {
    const category = await this.prisma.category.findUnique({
      where: {
        id,
        ownerId,
        deletedAt: null,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found or you do not have access.`);
    }
    return new CategoryDto(category);
  }

  async update(ownerId: string, id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryDto> {
    const existingCategory = await this.prisma.category.findUnique({
      where: {
        id,
        ownerId,
        deletedAt: null,
      },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID "${id}" not found or you do not have access.`);
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
    return new CategoryDto(updatedCategory);
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const existingCategory = await this.prisma.category.findUnique({
      where: {
        id,
        ownerId,
        deletedAt: null,
      },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID "${id}" not found or you do not have access.`);
    }

    await this.prisma.category.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
