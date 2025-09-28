import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DataIntegrationService } from './data-integration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateDataSourceDto } from './dto/create-data-source.dto';
import { TestConnectionDto } from './dto/test-connection.dto';
import { StoreDummyDataDto } from './dto/store-dummy-data.dto';

@ApiTags('Data Integration')
@Controller('data-sources')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DataIntegrationController {
  constructor(private readonly dataIntegrationService: DataIntegrationService) {}

  @Post()
  @ApiOperation({ summary: 'Connect a new data source' })
  @ApiResponse({ status: 201, description: 'Data source connected successfully' })
  @ApiResponse({ status: 400, description: 'Invalid configuration' })
  async createDataSource(@Request() req: any, @Body() createDataSourceDto: CreateDataSourceDto) {
    return await this.dataIntegrationService.createDataSource(req.user.id, createDataSourceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user data sources' })
  @ApiResponse({ status: 200, description: 'Data sources retrieved successfully' })
  async getDataSources(@Request() req: any) {
    return await this.dataIntegrationService.getDataSources(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get data source by ID' })
  @ApiResponse({ status: 200, description: 'Data source retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Data source not found' })
  async getDataSourceById(@Request() req: any, @Param('id') id: string) {
    return await this.dataIntegrationService.getDataSourceById(id, req.user.id);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test data source connection' })
  @ApiResponse({ status: 200, description: 'Connection test completed' })
  async testConnection(@Request() req: any, @Param('id') id: string) {
    const dataSource = await this.dataIntegrationService.getDataSourceById(id, req.user.id);
    return await this.dataIntegrationService.testConnection(req.user.id, dataSource.sourceType, dataSource.config);
  }

  @Post(':id/sync')
  @ApiOperation({ summary: 'Sync data from data source' })
  @ApiResponse({ status: 200, description: 'Data sync completed' })
  async syncDataSource(@Request() req: any, @Param('id') id: string) {
    return await this.dataIntegrationService.syncDataSource(id, req.user.id);
  }

  @Get(':id/events')
  @ApiOperation({ summary: 'Get data events from data source' })
  @ApiResponse({ status: 200, description: 'Data events retrieved successfully' })
  async getDataEvents(
    @Request() req: any,
    @Param('id') id: string,
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
  ) {
    return await this.dataIntegrationService.getDataEvents(
      id,
      req.user.id,
      parseInt(limit),
      parseInt(offset),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete data source' })
  @ApiResponse({ status: 200, description: 'Data source deleted successfully' })
  @ApiResponse({ status: 404, description: 'Data source not found' })
  async deleteDataSource(@Request() req: any, @Param('id') id: string) {
    await this.dataIntegrationService.deleteDataSource(id, req.user.id);
    return { message: 'Data source deleted successfully' };
  }

  // Dummy Data Generation Endpoints
  @Post('dummy-data')
  @ApiOperation({ summary: 'Store dummy data for testing' })
  @ApiResponse({ status: 201, description: 'Dummy data stored successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data format' })
  async storeDummyData(@Request() req: any, @Body() storeDummyDataDto: StoreDummyDataDto) {
    return await this.dataIntegrationService.storeDummyData(req.user.id, storeDummyDataDto);
  }

  @Post('dummy-data/bulk/:sourceType')
  @ApiOperation({ summary: 'Generate bulk dummy data for a source type' })
  @ApiResponse({ status: 201, description: 'Bulk dummy data generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid source type' })
  async generateBulkDummyData(
    @Request() req: any, 
    @Param('sourceType') sourceType: 'gtm' | 'facebook_pixel' | 'shopify'
  ) {
    return await this.dataIntegrationService.generateBulkDummyData(req.user.id, sourceType);
  }

  @Post('dummy-data/seed-all')
  @ApiOperation({ summary: 'Generate dummy data for all source types' })
  @ApiResponse({ status: 201, description: 'Dummy data generated for all sources' })
  async seedAllDummyData(@Request() req: any) {
    const results = {};
    
    // Generate dummy data for all source types
    const sourceTypes: ('gtm' | 'facebook_pixel' | 'shopify')[] = ['gtm', 'facebook_pixel', 'shopify'];
    
    for (const sourceType of sourceTypes) {
      try {
        results[sourceType] = await this.dataIntegrationService.generateBulkDummyData(req.user.id, sourceType);
      } catch (error) {
        results[sourceType] = { error: error.message };
      }
    }
    
    return {
      message: 'Dummy data generation completed',
      results
    };
  }
}
