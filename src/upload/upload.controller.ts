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

    // Retornar la URL de la imagen usando la IP de red para que sea accesible desde el móvil
    const port = process.env.PORT || 3000;
    // Usar BASE_URL si está definido, sino usar la IP de red local
    // La IP debe coincidir con la configurada en la app móvil (192.168.20.53)
    const baseUrl = process.env.BASE_URL || `http://192.168.20.53:${port}`;
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
}
