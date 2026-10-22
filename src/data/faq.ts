export const FAQ: { q: string; a: string; home?: boolean }[] = [
  { q: '¿Los perfumes son originales?', a: 'Sí. Trabajamos solo con frascos originales y sellados. Los decants se fraccionan de esos mismos frascos, sin diluir ni alterar la fragancia.', home: true },
  { q: '¿Qué es un decant?', a: 'Una porción de la fragancia original, de 3 o 5 ml, en un atomizador de vidrio sellado y etiquetado con nombre, volumen y lote. Es ideal para probar en piel, viajar o rotar entre varios perfumes.', home: true },
  { q: '¿Cuánto dura un decant de 3 ml?', a: 'Rinde alrededor de 40 atomizaciones: una a dos semanas de uso diario, según cuánto apliques. El de 5 ml rinde unas 70.', home: true },
  { q: '¿Cuánto tarda el envío?', a: 'Preparamos tu pedido en 24 a 48 horas hábiles y lo enviamos a todo el país con número de seguimiento.', home: true },
  { q: '¿Cómo pago?', a: 'Con Yape, Plin, tarjeta de crédito o débito mediante enlace de pago, o en cuotas con Powerpay. Coordinamos el pago por WhatsApp.' },
  { q: '¿Puedo devolver un producto?', a: '[Política de devolución a confirmar por EJH PRIVÉ: plazos y condiciones para frascos sellados y decants.]' },
];

export const faqJsonLd = (items = FAQ) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});
