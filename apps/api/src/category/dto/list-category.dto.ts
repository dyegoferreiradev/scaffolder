import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class ListCategoryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter categories by title (case-insensitive partial match)',
    example: 'work',
  })
  @IsOptional()
  @IsString()
  title?: string;
}
