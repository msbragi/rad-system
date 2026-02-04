import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import { BaseService } from '../../../common/services/base.service';
import { Department } from '../entities/department.entity';
import { SqlHelper } from 'src/common/utils/sql.helper';

@Injectable()
export class DepartmentsService extends BaseService<Department> {

  protected async checkOwnership(id: number | string, userId: number): Promise<boolean> {
      return Promise.resolve(true);
  }

  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {
    super(departmentRepository);
  }

  /**
   * Check if department id is used in users or contexts
   * Uses exact match with comma delimiters to avoid false positives
   */
  async isDepartmentInUse(code: string): Promise<boolean> {
    // Check in users - exact match with comma delimiters
    const usersWithDepartment = await this.userRepository
      .createQueryBuilder('user')
      .where(`${SqlHelper.wrapWithDelimiter('user.departments')} LIKE :code`, { code: `%,${code},%` })
      .getCount();
    if (usersWithDepartment > 0) return true;

  }

  /**
   * Override remove to check usage
   */
  async delete(id: number): Promise<void> {
    const department = await this.findOne(id);
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const inUse = await this.isDepartmentInUse(department.code);
    if (inUse) {
      throw new BadRequestException(
        'Cannot delete department: it is currently assigned to users or contexts'
      );
    }

    await super.getRepository().delete(id);
  }

  /**
   * Override update to prevent id change if in use
   */
  async update(id: number, updateData: Partial<Department>): Promise<Department> {
    const department = await this.findOne(id);
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // If trying to change code, check if old code is in use
    const inUse = await this.isDepartmentInUse(department.code);
    if (inUse) {
      throw new BadRequestException(
        'Cannot change department id: it is currently assigned to users or contexts'
      );
    }
console.log('----- Update departments -----');    
console.log(id, updateData);    
console.log('------------------------------');    
    return await super.update(id, updateData);
  }

}