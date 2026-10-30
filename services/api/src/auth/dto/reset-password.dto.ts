import { IsJWT, IsString, MinLength } from 'class-validator';

export class CreateResetPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsJWT()
  resetToken!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}
