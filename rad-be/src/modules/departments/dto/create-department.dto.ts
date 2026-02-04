import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { IDepartment } from '../../../common/interfaces/models.interface';

export class CreateDepartmentDto implements Partial<IDepartment> {

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  description: string;
}
