import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { ReportPostDto } from './dto/report-post.dto';
import { PostType, PostVisibility } from '@prisma/client';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  async createPost(userId: number, createPostDto: CreatePostDto) {
    // Verify user is a veterinarian
    const veterinarian = await this.prisma.veterinarian.findUnique({
      where: { userId },
    });

    if (!veterinarian || veterinarian.status !== 'VERIFIED') {
      throw new ForbiddenException('Only verified veterinarians can create posts');
    }

    // Validate clinical case requirements
    if (createPostDto.type === 'CLINICAL_CASE') {
      if (!createPostDto.declaresNoPersonalData) {
        throw new BadRequestException(
          'You must declare that the clinical case contains no personal data',
        );
      }
    }

    // Create post with transaction
    const post = await this.prisma.$transaction(async (tx) => {
      // Create main post
      const newPost = await tx.communityPost.create({
        data: {
          authorId: veterinarian.id,
          type: createPostDto.type,
          title: createPostDto.title,
          visibility: createPostDto.visibility || PostVisibility.PUBLIC,
          declaresNoPersonalData: createPostDto.declaresNoPersonalData || false,
          tags: createPostDto.tags || [],
        },
      });

      // Create type-specific details
      if (createPostDto.type === 'CLINICAL_CASE') {
        await tx.clinicalCaseDetails.create({
          data: {
            postId: newPost.id,
            species: createPostDto.species!,
            age: createPostDto.age,
            weight: createPostDto.weight,
            symptoms: createPostDto.symptoms!,
            diagnosis: createPostDto.diagnosis!,
            treatment: createPostDto.treatment!,
            evolution: createPostDto.evolution,
            images: createPostDto.images || [],
          },
        });

        // Award reputation points for clinical case
        await this.updateReputation(tx, veterinarian.id, 20);
      } else if (createPostDto.type === 'FORUM_DISCUSSION') {
        await tx.forumDetails.create({
          data: {
            postId: newPost.id,
            description: createPostDto.description!,
          },
        });
      } else if (createPostDto.type === 'ARTICLE') {
        await tx.articleDetails.create({
          data: {
            postId: newPost.id,
            content: createPostDto.content!,
            coverImage: createPostDto.coverImage,
          },
        });
      }

      return newPost;
    });

    return this.findOne(post.id, userId);
  }

  async findAll(queryDto: QueryPostsDto, userId: number) {
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const skip = (page - 1) * limit;

    // Get user role to determine visibility
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isVet = user?.role === 'VET';

    // Build where clause
    const where: any = {
      deletedAt: null,
    };

    // Visibility filter
    if (!isVet) {
      where.visibility = PostVisibility.PUBLIC;
    } else if (queryDto.visibility) {
      where.visibility = queryDto.visibility;
    }

    // Type filter
    if (queryDto.type) {
      where.type = queryDto.type;
    }

    // Tags filter
    if (queryDto.tags && queryDto.tags.length > 0) {
      where.tags = {
        hasSome: queryDto.tags,
      };
    }

    // Search filter
    if (queryDto.search) {
      where.title = {
        contains: queryDto.search,
        mode: 'insensitive',
      };
    }

    const [posts, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          clinicalCaseDetails: true,
          forumDetails: true,
          articleDetails: true,
          _count: {
            select: {
              likes: true,
              favorites: true,
              comments: true,
            },
          },
        },
      }),
      this.prisma.communityPost.count({ where }),
    ]);

    // Add user-specific data (liked, favorited)
    const postsWithUserData = await Promise.all(
      posts.map(async (post) => {
        const [liked, favorited] = await Promise.all([
          this.prisma.postLike.findUnique({
            where: {
              postId_userId: {
                postId: post.id,
                userId,
              },
            },
          }),
          this.prisma.postFavorite.findUnique({
            where: {
              postId_userId: {
                postId: post.id,
                userId,
              },
            },
          }),
        ]);

        return {
          ...post,
          liked: !!liked,
          favorited: !!favorited,
        };
      }),
    );

    return {
      data: postsWithUserData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(postId: number, userId: number) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        clinicalCaseDetails: true,
        forumDetails: true,
        articleDetails: true,
        comments: {
          where: { deletedAt: null },
          include: {
            author: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            replies: {
              where: { deletedAt: null },
              include: {
                author: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            likes: true,
            favorites: true,
            comments: true,
          },
        },
      },
    });

    if (!post || post.deletedAt) {
      throw new NotFoundException('Post not found');
    }

    // Check visibility
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isVet = user?.role === 'VET';

    if (post.visibility === PostVisibility.VETS_ONLY && !isVet) {
      throw new ForbiddenException('This post is only visible to veterinarians');
    }

    // Add user-specific data
    const [liked, favorited] = await Promise.all([
      this.prisma.postLike.findUnique({
        where: {
          postId_userId: {
            postId: post.id,
            userId,
          },
        },
      }),
      this.prisma.postFavorite.findUnique({
        where: {
          postId_userId: {
            postId: post.id,
            userId,
          },
        },
      }),
    ]);

    return {
      ...post,
      liked: !!liked,
      favorited: !!favorited,
    };
  }

  async createComment(postId: number, userId: number, createCommentDto: CreateCommentDto) {
    // Verify user is a veterinarian
    const veterinarian = await this.prisma.veterinarian.findUnique({
      where: { userId },
    });

    if (!veterinarian || veterinarian.status !== 'VERIFIED') {
      throw new ForbiddenException('Only verified veterinarians can comment');
    }

    // Verify post exists and is accessible
    const post = await this.findOne(postId, userId);

    // Create comment
    const comment = await this.prisma.comment.create({
      data: {
        postId,
        authorId: veterinarian.id,
        content: createCommentDto.content,
        parentId: createCommentDto.parentId,
      },
      include: {
        author: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return comment;
  }

  async toggleLike(postId: number, userId: number) {
    const existingLike = await this.prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      await this.prisma.postLike.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
      return { liked: false };
    } else {
      await this.prisma.postLike.create({
        data: {
          postId,
          userId,
        },
      });
      return { liked: true };
    }
  }

  async toggleFavorite(postId: number, userId: number) {
    const existingFavorite = await this.prisma.postFavorite.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingFavorite) {
      await this.prisma.postFavorite.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
      return { favorited: false };
    } else {
      await this.prisma.postFavorite.create({
        data: {
          postId,
          userId,
        },
      });
      return { favorited: true };
    }
  }

  async followVeterinarian(followingId: number, followerUserId: number) {
    const follower = await this.prisma.veterinarian.findUnique({
      where: { userId: followerUserId },
    });

    if (!follower || follower.status !== 'VERIFIED') {
      throw new ForbiddenException('Only verified veterinarians can follow others');
    }

    if (follower.id === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: follower.id,
          followingId,
        },
      },
    });

    if (existingFollow) {
      await this.prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: follower.id,
            followingId,
          },
        },
      });
      return { following: false };
    } else {
      await this.prisma.follow.create({
        data: {
          followerId: follower.id,
          followingId,
        },
      });
      return { following: true };
    }
  }

  async reportPost(postId: number, userId: number, reportPostDto: ReportPostDto) {
    // Verify post exists
    await this.findOne(postId, userId);

    const report = await this.prisma.report.create({
      data: {
        postId,
        reporterId: userId,
        reason: reportPostDto.reason,
      },
    });

    return report;
  }

  async markCommentAsHelpful(commentId: number, userId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Increment helpful count
    await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        helpfulCount: {
          increment: 1,
        },
      },
    });

    // Award reputation points to comment author
    await this.updateReputation(this.prisma, comment.authorId, 15);

    return { helpful: true };
  }

  private async updateReputation(
    prisma: PrismaService | any,
    veterinarianId: number,
    points: number,
  ) {
    const reputation = await prisma.veterinarianReputation.upsert({
      where: { veterinarianId },
      update: {
        totalPoints: {
          increment: points,
        },
      },
      create: {
        veterinarianId,
        totalPoints: points,
      },
    });

    return reputation;
  }
}
