export const descargarExcelFormateado = (
  datos: any[],
  tituloCurso: string,
  tipoReporte: 'Asistencias' | 'Calificaciones' | 'Constancias',
  criterioAprobacion?: string
) => {
  if (!datos || datos.length === 0) return;

  const nombreLimpio = tituloCurso.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fechaHoy = new Date().toLocaleDateString('es-MX');

  let headersHTML = '';
  let filasHTML = '';

  if (tipoReporte === 'Constancias') {
    headersHTML = `
      <tr style="background-color: #005293; color: #FFFFFF; font-weight: bold; font-family: Arial, sans-serif; font-size: 11pt;">
        <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: left;">Participante</th>
        <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: left;">Correo Electrónico</th>
        <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: center;">Código de Constancia</th>
        <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: center;">Fecha de Otorgamiento / Descarga</th>
      </tr>
    `;
    filasHTML = datos
      .map(
        (est, index) => `
      <tr style="background-color: ${index % 2 === 0 ? '#FFFFFF' : '#F8FAFC'}; font-family: Arial, sans-serif; font-size: 10pt;">
        <td style="padding: 8px; border: 1px solid #E2E8F0; font-weight: bold; color: #0F172A;">${est.nombre} ${est.apellido}</td>
        <td style="padding: 8px; border: 1px solid #E2E8F0; color: #005293;">${est.correo}</td>
        <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: center; font-weight: bold; color: #D8731E;">${est.codigo_constancia}</td>
        <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: center; color: #475569;">${est.fecha_descarga}</td>
      </tr>
    `
      )
      .join('');
  } else if (tipoReporte === 'Asistencias') {
    headersHTML = `
      <tr style="background-color: #005293; color: #FFFFFF; font-weight: bold; font-family: Arial, sans-serif; font-size: 11pt;">
        <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: left;">Participante</th>
        <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: left;">Correo Electrónico</th>
        <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: center;">Asistencias Registradas</th>
      </tr>
    `;
    filasHTML = datos
      .map(
        (est, index) => `
      <tr style="background-color: ${index % 2 === 0 ? '#FFFFFF' : '#F8FAFC'}; font-family: Arial, sans-serif; font-size: 10pt;">
        <td style="padding: 8px; border: 1px solid #E2E8F0; font-weight: bold; color: #0F172A;">${est.nombre} ${est.apellido}</td>
        <td style="padding: 8px; border: 1px solid #E2E8F0; color: #005293;">${est.correo}</td>
        <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: center; font-weight: bold; color: #005293;">${est.asistencias_curso}</td>
      </tr>
    `
      )
      .join('');
  } else if (tipoReporte === 'Calificaciones') {
    headersHTML = `
      <tr style="background-color: #B8006B; color: #FFFFFF; font-weight: bold; font-family: Arial, sans-serif; font-size: 11pt;">
        <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: left;">Participante</th>
        <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: left;">Correo Electrónico</th>
        <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: center;">Calificación Final</th>
        <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: center;">Criterio Requerido</th>
        <th style="padding: 10px; border: 1px solid #CCCCCC; text-align: center;">Estatus Acreditación</th>
      </tr>
    `;
    filasHTML = datos
      .map((est, index) => {
        const esAprobado = est.aprobado || est.estatus === 'Aprobado';
        const colorBg = esAprobado ? '#E2F0D9' : '#FCE8E6';
        const colorTxt = esAprobado ? '#385723' : '#A50E0E';
        return `
      <tr style="background-color: ${index % 2 === 0 ? '#FFFFFF' : '#F8FAFC'}; font-family: Arial, sans-serif; font-size: 10pt;">
        <td style="padding: 8px; border: 1px solid #E2E8F0; font-weight: bold; color: #0F172A;">${est.nombre} ${est.apellido}</td>
        <td style="padding: 8px; border: 1px solid #E2E8F0; color: #005293;">${est.correo}</td>
        <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: center; font-weight: bold;">${est.calificacion_real}</td>
        <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: center; color: #64748B;">${est.criterio_requerido || criterioAprobacion || '80'}</td>
        <td style="padding: 8px; border: 1px solid #E2E8F0; text-align: center; font-weight: bold; background-color: ${colorBg}; color: ${colorTxt};">${est.estatus}</td>
      </tr>
    `;
      })
      .join('');
  }

  const templateHTML = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Reporte PLAi</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
        </style>
      </head>
      <body>
        <div style="margin-bottom: 15px;">
          <h2 style="color: #005293; margin: 0; font-size: 16pt;">PLAi - Plataforma Abierta de Innovación</h2>
          <h3 style="color: #334155; margin: 5px 0 0 0; font-size: 13pt;">Reporte de ${tipoReporte}: ${tituloCurso}</h3>
          <p style="color: #64748B; font-size: 10pt; margin: 3px 0 15px 0;">Fecha de emisión: ${fechaHoy} | Total de participantes: ${datos.length}</p>
        </div>
        <table>
          <thead>
            ${headersHTML}
          </thead>
          <tbody>
            ${filasHTML}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([templateHTML], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Reporte_${tipoReporte}_${nombreLimpio}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};