import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';

type ErrorBody = {
  statusCode: number;
  code: string;
  message: string;
};

function make(status: number, code: string, message: string): HttpException {
  const body: ErrorBody = {
    statusCode: status,
    code,
    message,
  };
  return new HttpException(body, status);
}

export class ErrorFactory {
  static notXlsx() {
    return new BadRequestException({
      statusCode: HttpStatus.BAD_REQUEST, // 400
      code: 'IMPORT_NOT_XLSX',
      message: 'Nur .xlsx Dateien erlaubt',
    });
  }

  static emptyFile() {
    return new BadRequestException({
      statusCode: HttpStatus.BAD_REQUEST, // 400
      code: 'IMPORT_EMPTY_FILE',
      message: 'Die hochgeladene Datei ist leer oder fehlt.',
    });
  }

  static uploadFailes(import_id: string) {
    return make(
      500,
      'UPLOAD_FAILED',
      `Upload von ${import_id} fehlgeschlagen `,
    );
  }
}
