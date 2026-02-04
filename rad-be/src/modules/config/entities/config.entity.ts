import { BaseEntity } from 'src/common/entities/base.entity';
import { JsonStringTransformer } from 'src/common/utils/json-string.transformer';
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('rad_config')
export class RadConfig extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  key: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false, name: 'is_env_value' }) // <-- Nuovo campo
  isEnvValue: boolean;

  // --- To mantain json ordering ---
  @Column({ 
    type: 'text',
    transformer: new JsonStringTransformer() 
  })
  value: any;
}