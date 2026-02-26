import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { ReportPostDto } from './dto/report-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VetOnlyGuard } from './guards/vet-only.guard';

@Controller('community')
@UseGuards(JwtAuthGuard)
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Post('posts')
  @UseGuards(VetOnlyGuard)
  createPost(@Request() req, @Body() createPostDto: CreatePostDto) {
    return this.communityService.createPost(req.user.userId, createPostDto);
  }

  @Get('posts')
  findAll(@Query() queryDto: QueryPostsDto, @Request() req) {
    return this.communityService.findAll(queryDto, req.user.userId);
  }

  @Get('posts/:id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.communityService.findOne(id, req.user.userId);
  }

  @Post('posts/:id/comment')
  @UseGuards(VetOnlyGuard)
  createComment(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.communityService.createComment(id, req.user.userId, createCommentDto);
  }

  @Post('posts/:id/like')
  toggleLike(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.communityService.toggleLike(id, req.user.userId);
  }

  @Post('posts/:id/favorite')
  toggleFavorite(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.communityService.toggleFavorite(id, req.user.userId);
  }

  @Post('follow/:vetId')
  @UseGuards(VetOnlyGuard)
  followVeterinarian(
    @Param('vetId', ParseIntPipe) vetId: number,
    @Request() req,
  ) {
    return this.communityService.followVeterinarian(vetId, req.user.userId);
  }

  @Post('posts/:id/report')
  reportPost(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() reportPostDto: ReportPostDto,
  ) {
    return this.communityService.reportPost(id, req.user.userId, reportPostDto);
  }

  @Post('comments/:id/helpful')
  markCommentAsHelpful(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.communityService.markCommentAsHelpful(id, req.user.userId);
  }
}
