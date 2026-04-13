// controllers/pdf.controller.js
const pool = require('../config/database');
const PDFDocument = require('pdfkit');

const pdfController = {
    async generarFacturaPDF(req, res) {
        const { ventaId } = req.params;
        
        try {
            // Obtener datos de la venta
            const ventaResult = await pool.query(
                `SELECT v.*, u.nombre as usuario_nombre, c.nombre as cliente_nombre, c.documento as cliente_documento
                 FROM ventas v
                 LEFT JOIN usuarios u ON v.usuario_id = u.id
                 LEFT JOIN clientes c ON v.cliente_id = c.id
                 WHERE v.id = $1`,
                [ventaId]
            );
            
            if (ventaResult.rows.length === 0) {
                return res.status(404).json({ error: 'Venta no encontrada' });
            }
            
            const venta = ventaResult.rows[0];
            
            // Obtener detalles de la venta
            const detallesResult = await pool.query(
                `SELECT vd.*, p.nombre as producto_nombre, p.codigo_barras
                 FROM ventas_detalle vd
                 JOIN productos p ON vd.producto_id = p.id
                 WHERE vd.venta_id = $1`,
                [ventaId]
            );
            
            // Crear PDF
            const doc = new PDFDocument({ margin: 50 });
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=factura_${venta.folio}.pdf`);
            
            doc.pipe(res);
            
            // Encabezado
            doc.fontSize(20).text('FACTURA', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Folio: ${venta.folio}`, { align: 'right' });
            doc.text(`Fecha: ${new Date(venta.fecha).toLocaleString()}`, { align: 'right' });
            doc.moveDown();
            
            // Datos del cliente
            doc.fontSize(14).text('DATOS DEL CLIENTE');
            doc.fontSize(10);
            doc.text(`Nombre: ${venta.cliente_nombre || 'Cliente General'}`);
            doc.text(`Documento: ${venta.cliente_documento || 'N/A'}`);
            doc.moveDown();
            
            // Datos de la empresa
            doc.fontSize(14).text('DATOS DE LA EMPRESA');
            doc.fontSize(10);
            doc.text('Sistema de Gestión');
            doc.text('RUC: 12345678901');
            doc.text('Dirección: Calle Principal 123');
            doc.moveDown();
            
            // Tabla de productos
            doc.fontSize(12).text('DETALLE DE PRODUCTOS', { underline: true });
            doc.moveDown(0.5);
            
            // Cabeceras de tabla
            let y = doc.y;
            doc.fontSize(10);
            doc.text('Cantidad', 50, y);
            doc.text('Producto', 120, y);
            doc.text('Precio Unit.', 350, y);
            doc.text('Subtotal', 450, y);
            
            doc.moveDown();
            let yLine = doc.y;
            doc.moveTo(50, yLine).lineTo(550, yLine).stroke();
            doc.moveDown(0.5);
            
            // Filas de productos
            let total = 0;
            for (const item of detallesResult.rows) {
                y = doc.y;
                doc.text(item.cantidad.toString(), 50, y);
                doc.text(item.producto_nombre.substring(0, 30), 120, y);
                doc.text(`$${item.precio_unitario.toFixed(2)}`, 350, y);
                doc.text(`$${item.subtotal.toFixed(2)}`, 450, y);
                doc.moveDown();
                total += parseFloat(item.subtotal);
            }
            
            doc.moveDown();
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();
            
            // Totales
            const impuesto = total * 0.16;
            const totalFinal = total + impuesto;
            
            doc.fontSize(12);
            doc.text(`Subtotal: $${total.toFixed(2)}`, { align: 'right' });
            doc.text(`IVA (16%): $${impuesto.toFixed(2)}`, { align: 'right' });
            doc.text(`TOTAL: $${totalFinal.toFixed(2)}`, { align: 'right', bold: true });
            doc.moveDown();
            
            // Método de pago
            doc.fontSize(10);
            doc.text(`Método de pago: ${venta.metodo_pago}`);
            doc.text(`Atendido por: ${venta.usuario_nombre}`);
            doc.moveDown();
            
            // Pie de página
            doc.fontSize(8);
            doc.text('Gracias por su compra', { align: 'center' });
            doc.text('Este documento es una representación impresa de la factura electrónica', { align: 'center' });
            
            doc.end();
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = pdfController;