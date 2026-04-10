import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as fs from 'fs';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  @Post('pet-photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          // Usar ruta absoluta basada en el directorio raíz del proyecto
          // process.cwd() devuelve el directorio desde donde se ejecuta el proceso
          const uploadPath = join(process.cwd(), 'uploads', 'pets');
          // Crear directorio si no existe
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          // Generar nombre único: timestamp + random + extensión
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `pet-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
      },
      fileFilter: (req, file, cb) => {
        // Aceptar solo imágenes
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Solo se permiten archivos de imagen (jpg, jpeg, png, gif, webp)'), false);
        }
      },
    }),
  )
  uploadPetPhoto(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    // Retornar la URL de la imagen
    // En producción usar BASE_URL o la URL pública, en desarrollo usar IP local
    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = process.env.BASE_URL || (isProduction 
      ? 'https://nala-api.patasypelos.xyz' 
      : `http://192.168.20.53:${process.env.PORT || 3000}`);
    const fileUrl = `${baseUrl}/uploads/pets/${file.filename}`;

    console.log('📸 Foto subida:', {
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      url: fileUrl,
    });

    return {
      message: 'Imagen subida correctamente',
      url: fileUrl,
      filename: file.filename,
    };
  }

  @Post('user-photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'users');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req: any, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const userId = req.user?.userId || 'unknown';
          cb(null, `user-${userId}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Solo se permiten archivos de imagen (jpg, jpeg, png, gif, webp)'), false);
        }
      },
    }),
  )
  uploadUserPhoto(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    // Retornar la URL de la imagen
    // En producción usar BASE_URL o la URL pública, en desarrollo usar IP local
    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = process.env.BASE_URL || (isProduction 
      ? 'https://nala-api.patasypelos.xyz' 
      : `http://192.168.20.53:${process.env.PORT || 3000}`);
    const fileUrl = `${baseUrl}/uploads/users/${file.filename}`;

    console.log('📸 Foto de usuario subida:', {
      userId: req.user?.userId,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      url: fileUrl,
    });

    return {
      message: 'Foto de perfil subida correctamente',
      url: fileUrl,
      filename: file.filename,
    };
  }

  @Post('veterinarian-photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'veterinarians');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req: any, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const userId = req.user?.userId || 'unknown';
          cb(null, `vet-${userId}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Solo se permiten archivos de imagen (jpg, jpeg, png, gif, webp)'), false);
        }
      },
    }),
  )
  uploadVeterinarianPhoto(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    // Retornar la URL de la imagen
    // En producción usar BASE_URL o la URL pública, en desarrollo usar IP local
    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = process.env.BASE_URL || (isProduction 
      ? 'https://nala-api.patasypelos.xyz' 
      : `http://192.168.20.53:${process.env.PORT || 3000}`);
    const fileUrl = `${baseUrl}/uploads/veterinarians/${file.filename}`;

    console.log('📸 Foto de veterinario subida:', {
      userId: req.user?.userId,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      url: fileUrl,
    });

    return {
      message: 'Foto de perfil subida correctamente',
      url: fileUrl,
      filename: file.filename,
    };
  }
}
