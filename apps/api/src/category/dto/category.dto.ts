import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '@prisma/client';

export class CategoryDto {
  @ApiProperty({ description: 'The unique identifier of the category', example: 'clx0x0x0x0x0x0x0x0x0x0x0' })
  id!: string;

  @ApiProperty({ description: 'The title of the category', example: 'Work' })
  title!: string;

  @ApiProperty({ description: 'The ID of the user who owns this category', example: 'clx0x0x0x0x0x0x0x0x0x0x0' })
  ownerId!: string;

  @ApiProperty({ description: 'Timestamp when the category was created', example: '2023-10-27T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ description: 'Timestamp when the category was last updated', example: '2023-10-27T11:00:00.000Z' })
  updatedAt!: Date;

  @ApiPropertyOptional({ description: 'Timestamp when the category was soft-deleted', example: '2023-10-27T12:00:00.000Z', nullable: true })
  deletedAt!: Date | null;

  constructor(category: Category) {
    this.id = category.id;
    this.title = category.title;
    this.ownerId = category.ownerId;
    this.createdAt = category.createdAt;
    this.updatedAt = category.updatedAt;
    this.deletedAt = category.deletedAt;
  }
}
