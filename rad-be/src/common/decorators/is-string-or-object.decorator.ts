import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsStringOrObjectConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    // Ritorna 'true' se il valore è una stringa o se è un oggetto (ma non un array o null)
    return typeof value === 'string' || (typeof value === 'object' && value !== null && !Array.isArray(value));
  }

  defaultMessage() {
    return 'The value must be either a string or an object.';
  }
}

export function IsStringOrObject(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStringOrObjectConstraint,
    });
  };
}