const DUPLICATE_FIELD_LABELS = {
  sku: 'Mã sản phẩm (SKU)',
  email: 'Địa chỉ email',
  code: 'Mã định danh / Mã giảm giá',
  slug: 'Đường dẫn tĩnh (slug)',
  name: 'Tên bản ghi',
  orderCode: 'Mã đơn hàng',
  trackingCode: 'Mã vận đơn',
  txnCode: 'Mã giao dịch',
  key: 'Khóa cấu hình'
};

export function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Không tìm thấy đường dẫn API: ${req.method} ${req.originalUrl}`,
      details: []
    }
  });
}

export function errorHandler(err, req, res, _next) {
  // 1. Lỗi chủ động AppError từ tầng controller / validation
  if (err.name === 'AppError' && err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || (err.statusCode === 404 ? 'NOT_FOUND' : err.statusCode === 409 ? 'CONFLICT' : 'VALIDATION_ERROR'),
        message: err.message,
        details: err.details || []
      }
    });
  }

  // 2. Lỗi cú pháp JSON trong request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Định dạng dữ liệu JSON gửi lên không hợp lệ.',
        details: []
      }
    });
  }

  // 3. Lỗi trùng khóa duy nhất MongoDB (E11000) -> HTTP 409 Conflict
  const mongoErr = err.code === 11000 ? err : err?.cause?.code === 11000 ? err.cause : null;
  if (mongoErr) {
    const dupFields = Object.keys(mongoErr.keyPattern || mongoErr.keyValue || {});
    const primaryField = dupFields[0] || 'trường dữ liệu';
    const fieldLabel = DUPLICATE_FIELD_LABELS[primaryField] || primaryField;
    const dupVal = mongoErr.keyValue?.[primaryField];
    const message = dupVal !== undefined
      ? `${fieldLabel} "${dupVal}" đã tồn tại trong hệ thống. Vui lòng chọn giá trị khác.`
      : `${fieldLabel} đã tồn tại trong hệ thống.`;

    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message,
        details: dupFields.map((f) => ({
          field: f,
          message: `${DUPLICATE_FIELD_LABELS[f] || f} bị trùng lặp`
        }))
      }
    });
  }

  // 4. Lỗi Mongoose ValidationError -> HTTP 400
  if (err.name === 'ValidationError' && err.errors) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: details[0]?.message || 'Dữ liệu đầu vào không hợp lệ.',
        details
      }
    });
  }

  // 5. Lỗi Mongoose CastError (sai định dạng ObjectId hoặc sai kiểu dữ liệu) -> HTTP 400
  if (err.name === 'CastError') {
    const isId = err.path === '_id';
    return res.status(400).json({
      success: false,
      error: {
        code: isId ? 'INVALID_ID' : 'VALIDATION_ERROR',
        message: isId
          ? `Mã định danh "${err.value}" không đúng định dạng hợp lệ.`
          : `Giá trị của trường "${err.path}" không đúng kiểu dữ liệu hợp lệ.`,
        details: [{ field: err.path, message: err.message }]
      }
    });
  }

  // 6. Các lỗi máy chủ không lường trước -> HTTP 500
  console.error('[Backend Error]:', err);
  return res.status(err.statusCode || 500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Đã xảy ra lỗi hệ thống phía máy chủ. Vui lòng thử lại sau.',
      details: process.env.NODE_ENV === 'development' ? [{ message: err.message }] : []
    }
  });
}
