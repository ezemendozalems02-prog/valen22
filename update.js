const fs = require('fs');
const file = 'c:\\\\Users\\\\admin}\\\\Desktop\\\\estas-para-mas-landing\\\\index.html';
let html = fs.readFileSync(file, 'utf8');

// 1. Hero Title
html = html.replace('<h1>Una vida 7<br>no se arregla <em>sola.</em></h1>', '<h1>Hay una forma de vivir que todavía no conoces</h1>');

// 2. Hero Story
html = html.replace('Un 4 te obliga a moverte. Un 7 te deja quieta doce años esperando que mejore\n          solo. <b>El 17 de agosto dejás de esperar.</b>', 'Un 4/10 te obliga a moverte. Un 7/10 te deja quieta doce años esperando que mejore\n          solo. <b>El 17 de agosto dejas de esperar.</b>');

// 3. Hero Buttons
html = html.replace(/<div class="hero-ctas">[\s\S]*?<\/div>/, `<div class="hero-ctas">
          <a href="#reservar" class="btn btn-primary">Ver qué pasa ese día <span class="arw">→</span></a>
        </div>`);

// 4. Meter Section
html = html.replace(/<div class="meter">[\s\S]*?<\/div>\n      <\/div>/, `<div class="meter" id="form-container">
        <style>
            .form-options { display: flex; flex-direction: column; gap: 8px; margin-top: 15px; }
            .form-options-flex { display: flex; gap: 10px; margin-top: 15px; }
            .form-options .notch, .form-options-flex .notch { height: auto; padding: 12px; font-size: 0.9rem; text-transform: none; justify-content: center; }
            .form-result-text { font-size: 1rem; color: #fff; line-height: 1.6; }
            .form-result-text strong { font-family: var(--display); font-size: 1.2rem; color: var(--bronce); display: block; margin-bottom: 10px; }
        </style>
        <div id="step-1">
            <div class="meter-q">¿Que área de tu vida querés que mejore?</div>
            <div class="form-options">
                <button class="notch" onclick="nextStep(1, 'Relaciones amorosas')">Relaciones amorosas</button>
                <button class="notch" onclick="nextStep(1, 'Entorno/amistades')">Entorno/amistades</button>
                <button class="notch" onclick="nextStep(1, 'Trabajo/profesión')">Trabajo/profesión</button>
                <button class="notch" onclick="nextStep(1, 'Económica')">Económica</button>
                <button class="notch" onclick="nextStep(1, 'Conmigo misma')">Conmigo misma</button>
            </div>
        </div>
        <div id="step-2" style="display:none;">
            <div class="meter-q">Del 1 al 10 ¿Cómo def tu vida?</div>
            <div class="scale" id="scale-new" style="margin-top: 15px;"></div>
        </div>
        <div id="step-3" style="display:none;">
            <div class="meter-q">¿Estás dispuesta a tomar la responsabilidad que tu vida conlleva?</div>
            <div class="form-options-flex">
                <button class="notch" onclick="nextStep(3, 'Si')">Si</button>
                <button class="notch" onclick="nextStep(3, 'No')">No</button>
            </div>
        </div>
        <div id="step-result" style="display:none;">
            <div class="meter-out" id="form-result" style="border-top:none; margin-top:0; padding-top:0;"></div>
        </div>
      </div>
      </div>`);

// 5. Hero Stats
html = html.replace(/<div class="hero-stats">[\s\S]*?<\/div>\n    <\/div>/, `<div class="hero-stats" style="grid-template-columns: repeat(3, 1fr);">
      <div class="hstat"><b>11 hs</b><span>Una transformación de verdad de 9 am a 8 pm</span></div>
      <div class="hstat"><b>Feriado</b><span>17 de agosto</span></div>
      <div class="hstat"><b>150</b><span>Mujeres en un mismo salón premium en capital federal</span></div>
    </div>
  </div>`);

// 6. Trust Bar (remove)
html = html.replace(/<!-- ============ TRUST BAR ============ -->[\s\S]*?<!-- ============ PUNTO DE ENTRADA ============ -->/, '<!-- ============ PUNTO DE ENTRADA ============ -->');

// 7. Punto de Entrada (VSL instead of text)
html = html.replace(/<div class="entry-body">[\s\S]*?<\/div>\n\n      <div class="entry-buy">/, `<div class="entry-body" style="padding: 0; background: #000; display: flex; align-items: center; justify-content: center; min-height: 400px; border-radius: var(--r) 0 0 var(--r);">
        <div style="color: #fff; font-family: var(--mono); letter-spacing: 2px; text-transform: uppercase;">
            [ Espacio para el VSL ]
        </div>
      </div>

      <div class="entry-buy" style="border-left: none; border-top: 1px solid var(--linea);">
`);

// 8. Agenda Section
html = html.replace(/<div class="agenda rv">[\s\S]*?<\/div>\n\n    <figure class="agenda-shot rv">[\s\S]*?<\/figure>/, `
    <div class="agenda rv" style="padding: 40px 0; text-align: center;">
      <div style="max-width: 600px; margin: 0 auto 40px;">
        <h3 style="font-size: 1.5rem; margin-bottom: 20px;">¿Que pasa ese día?</h3>
        <p class="lead" style="margin-bottom: 40px;">Esto se vuelve tu estado natural.</p>
        <div style="background: var(--berenjena-alt); padding: 40px; border-radius: var(--r); border: 1px dashed var(--bronce);">
            [ Espacio para testimonios hablados de las chicas ]
        </div>
      </div>
    </div>
    <figure class="agenda-shot rv">
      <div style="width:100%; height:420px; background:#ddd; display:flex; align-items:center; justify-content:center; color:var(--gris); font-family:var(--mono); text-transform:uppercase; letter-spacing:2px;">
        [ Imagen de Line Up / Ponentes ]
      </div>
    </figure>
`);

// 9. Nuestra Historia Section
html = html.replace('<h2>Nadie se salva de una vida que está bien.</h2>', '<h2>Nuestra historia</h2>');
html = html.replace('<span class="story-cap">Edición anterior · Córdoba</span>', '');
html = html.replace(/<div class="story-body rv">[\s\S]*?<\/div>\n    <\/div>/, `<div class="story-body rv">
        <div class="pull" style="margin-top: 0;">
          “Mi trabajo no es que me sigas, es que aprendas a confiar en vos misma y construyas tu vida 10/10.”
        </div>
      </div>
    </div>`);

// 10. Remove Ladder, Testimonials, Lead Capture
html = html.replace(/<!-- ============ EL CAMINO \/ COMPARADOR ============ -->[\s\S]*?<!-- ============ BANDA FINAL ============ -->/, '<!-- ============ BANDA FINAL ============ -->');

// 11. Fix Banda Final & Footer
html = html.replace(/<div class="foot-grid">[\s\S]*?<div class="foot-bot">/, `<div class="foot-grid" style="grid-template-columns: 1fr; text-align: center; justify-items: center;">
      <div class="foot-brand" style="display: flex; flex-direction: column; align-items: center;">
        <span class="logo">ESTÁS PARA MÁS</span>
        <p style="max-width: 400px; margin: 0 auto; text-align: center;">
          Una experiencia de expansión de identidad para mujeres que saben
          que su vida puede ser más grande.
        </p>
        <div class="socials" style="justify-content: center;">
          <a href="#" class="soc" aria-label="Instagram">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke-width="1.6"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>
          </a>
          <a href="#" class="soc" aria-label="WhatsApp">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke-width="1.6"><path d="M21 11.5a8.4 8.4 0 01-12.6 7.3L3 21l2.3-5.3A8.4 8.4 0 1121 11.5z"/></svg>
          </a>
        </div>
      </div>
    </div>
    <div class="foot-bot">`);

// Remove nav links
html = html.replace(/<div class="nav-links">[\s\S]*?<\/div>/, '');

fs.writeFileSync(file, html);
console.log('HTML modified successfully');
