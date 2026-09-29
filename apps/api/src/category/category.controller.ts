import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryDto } from './dto/category.dto';
import { ListCategoryDto } from './dto/list-category.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../access/access.decorators';
import { SafeUserProfile } from '../auth/auth.types';

@ApiBearerAuth()
@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiCreatedResponse({
    description: 'The category has been successfully created.',
    type: CategoryDto,
  })
  async create(
    @CurrentUser() user: SafeUserProfile,
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryDto> {
    return this.categoryService.create(user.id, createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a list of categories for the current user' })
  @ApiOkResponse({
    description: 'A paginated list of categories.',
    type: PaginatedResponseDto<CategoryDto>,
  })
  async findAll(
    @CurrentUser() user: SafeUserProfile,
    @Query() listCategoryDto: ListCategoryDto,
  ): Promise<PaginatedResponseDto<CategoryDto>> {
    return this.categoryService.findAll(user.id, listCategoryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single category by ID' })
  @ApiOkResponse({
    description: 'The category details.',
    type: CategoryDto,
  })
  async findOne(
    @CurrentUser() user: SafeUserProfile,
    @Param('id') id: string,
  ): Promise<CategoryDto> {
    return this.categoryService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing category' })
  @ApiOkResponse({
    description: 'The category has been successfully updated.',
    type: CategoryDto,
  })
  async update(
    @CurrentUser() user: SafeUserProfile,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryDto> {
    return this.categoryService.update(user.id, id, updateCategoryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a category by ID' })
  @ApiNoContentResponse({
    description: 'The category has been successfully soft-deleted.',
  })
  async remove(
    @CurrentUser() user: SafeUserProfile,
    @Param('id') id: string,
  ): Promise<void> {
    await this.categoryService.remove(user.id, id);
  }
}
