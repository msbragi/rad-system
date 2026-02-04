import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { IDepartment } from '../../../common/interfaces/models.interface';

@Entity('departments')
export class Department extends BaseEntity implements IDepartment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10, unique: true })
  code: string;

  @Column({ length: 100 })
  description: string;
}