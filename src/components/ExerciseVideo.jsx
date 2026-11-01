// Exercícios para pesquisar no YouTube:
// Peito: Supino reto com barra, Supino inclinado com halteres, Crucifixo na máquina,
// Crossover na polia, Flexão de braços.
// Costas: Puxada frontal na polia, Remada baixa, Remada curvada com barra,
// Remada unilateral com halter, Barra fixa.
// Ombros: Desenvolvimento com halteres, Elevação lateral com halteres,
// Elevação lateral na polia, Crucifixo inverso na máquina, Face pull.
// Bíceps: Rosca direta com barra, Rosca alternada com halteres, Rosca martelo,
// Rosca Scott.
// Tríceps: Tríceps na polia com corda, Tríceps testa, Tríceps francês, Supino fechado.
// Antebraços: Rosca inversa, Flexão de punhos, Extensão de punhos.
// Pernas e glúteos: Agachamento livre, Leg press 45°, Cadeira extensora,
// Afundo com halteres, Mesa flexora, Cadeira flexora, Levantamento terra romeno,
// Stiff com halteres, Elevação pélvica, Cadeira abdutora, Ponte de glúteos,
// Coice de glúteo na polia.
// Panturrilhas: Panturrilha em pé, Panturrilha sentado, Panturrilha no leg press.
// Abdômen: Abdominal crunch, Elevação de pernas, Prancha, Abdominal na polia.
//
// Cole o link normal do YouTube entre as aspas. Aceita links de vídeos, Shorts e youtu.be.
const exerciseYoutubeLinks = {
  'Supino reto com barra': 'https://youtube.com/shorts/50RSzhMG5Hc?si=G74kT1dmwRYeFf1-',
  'Supino inclinado com halteres': 'https://youtube.com/shorts/wkUemXl4vFI?si=z24-sUz6siUZO8cr',
  'Crucifixo na máquina': 'https://youtube.com/shorts/CcZtaPI9YEE?si=dn9lrDiVK3RLqKse', // Cole o link do YouTube aqui
  'Crossover na polia': 'https://youtube.com/shorts/poe7X02U2qw?si=0HhW_Klk2hxL4tux', // Cole o link do YouTube aqui
  'Flexão de braços': 'https://youtube.com/shorts/lzfBPaGyXwM?si=uNCRsuqREj5Tl5mu', // Cole o link do YouTube aqui
  'Puxada frontal na polia': 'https://youtube.com/shorts/oF-RqXrkZHU?si=gu7woGp-Rq_BAwN8', // Cole o link do YouTube aqui
  'Remada baixa': 'https://youtube.com/shorts/zw0lUIPCq-U?si=Msj3w4S1dyoHBXnX', // Cole o link do YouTube aqui
  'Remada curvada com barra': 'https://youtube.com/shorts/mPocPp1cTRI?si=mm5T9wu3W5nFyAg8', // Cole o link do YouTube aqui
  'Remada unilateral com halter': 'https://youtube.com/shorts/RmowAgP6vsk?si=eIzeoK68uxzoO4Qb', // Cole o link do YouTube aqui
  'Barra fixa': 'https://youtube.com/shorts/hxIF6qwBr2M?si=lEoA6ncCUcJjp9BX', // Cole o link do YouTube aqui
  'Desenvolvimento com halteres': 'https://youtube.com/shorts/TLvK2UExsD8?si=nF2-jbP8YXclLrLa', // Cole o link do YouTube aqui
  'Elevação lateral com halteres': 'https://youtube.com/shorts/7q282CL_DSU?si=tx53vpudkJlJ4JGT', // Cole o link do YouTube aqui
  'Elevação lateral na polia': 'https://youtube.com/shorts/08F4SWOlR38?si=HEjme_ciDaAozwm3', // Cole o link do YouTube aqui
  'Crucifixo inverso na máquina': 'https://youtube.com/shorts/IbmM78SlAAM?si=RJtC65Yy1Z8cRnZA', // Cole o link do YouTube aqui
  'Face pull': 'https://youtube.com/shorts/zbNFcAmLdJk?si=YkwlUSrVgGcL2IbA', // Cole o link do YouTube aqui
  'Rosca direta com barra': 'https://youtu.be/ioqAYxjqIAo?si=isXXCmbBRsyIgYEa', // Cole o link do YouTube aqui
  'Rosca alternada com halteres': 'https://youtu.be/AuBN9_8Iihc?si=4OMpZIBadr0CgQdm', // Cole o link do YouTube aqui
  'Rosca martelo': 'https://youtube.com/shorts/zjYiIf93ZBc?si=hQghqYXT_sT9C0to', // Cole o link do YouTube aqui
  'Rosca Scott': 'https://youtube.com/shorts/faBk2akE0mQ?si=UFvAtCXVdNq5pDoa', // Cole o link do YouTube aqui
  'Tríceps na polia com corda': 'https://youtube.com/shorts/VnFopAIGO7E?si=GHPFAQ98pEzIro0H', // Cole o link do YouTube aqui
  'Tríceps testa': 'https://youtube.com/shorts/hKoIsBCpioI?si=yTqxKofRAtmwOxtW', // Cole o link do YouTube aqui
  'Tríceps francês': 'https://youtube.com/shorts/TkGyrH6EQK4?si=kDt0NJsnM3kKSNXu', // Cole o link do YouTube aqui
  'Supino fechado': 'https://youtube.com/shorts/sqS4zF_T0XM?si=kA7w02Paq0RMkuXu', // Cole o link do YouTube aqui
  'Rosca inversa': 'https://youtube.com/shorts/b57Wyr7c1Xk?si=FrrX6m3SbjKcQf-i', // Cole o link do YouTube aqui
  'Flexão de punhos': 'https://youtube.com/shorts/KNCOPP-yYLc?si=E3ndtun2WC6jQegY', // Cole o link do YouTube aqui
  'Extensão de punhos': 'https://youtube.com/shorts/KNCOPP-yYLc?si=caRIQpPUC6Q5uWDg', // Cole o link do YouTube aqui
  'Agachamento livre': 'https://youtube.com/shorts/Fpens-iRVmI?si=mifkJCg7hjUuID5E', // Cole o link do YouTube aqui
  'Leg press 45°': 'https://youtube.com/shorts/DQ4-HXFlKXI?si=WepYI5mS-bDlO2cf', // Cole o link do YouTube aqui
  'Cadeira extensora': 'https://youtube.com/shorts/u68RNdfZymA?si=N3qZcVGuuO7KcEMH', // Cole o link do YouTube aqui
  'Afundo com halteres': 'https://youtube.com/shorts/tzybc1Hu3Zw?si=TuhAnWfW__HjWIws', // Cole o link do YouTube aqui
  'Mesa flexora': 'https://youtu.be/2-ULaRrQa7c?si=LdkSKVlPFg2saGU4', // Cole o link do YouTube aqui
  'Cadeira flexora': 'https://youtube.com/shorts/MqhoP1kWMA8?si=JttvZ-0B3vUCViLI', // Cole o link do YouTube aqui
  'Levantamento terra romeno': 'https://youtube.com/shorts/HSk9so5mwg0?si=BzxwQzt4ftkFz25K', // Cole o link do YouTube aqui
  'Stiff com halteres': 'https://youtube.com/shorts/GDvKWauLQvc?si=-l0mhJgdQEd-U1NJ', // Cole o link do YouTube aqui
  'Elevação pélvica': 'https://youtube.com/shorts/ICdsKf6yTys?si=QpGosdxwzusmc-k6', // Cole o link do YouTube aqui
  'Cadeira abdutora': 'https://youtube.com/shorts/UA4r6un0AAM?si=33q3YhGl5c5xGSlM', // Cole o link do YouTube aqui
  'Ponte de glúteos': 'https://youtube.com/shorts/1satDE63Bwc?si=2OhoIO47YKq1QkR-', // Cole o link do YouTube aqui
  'Coice de glúteo na polia': 'https://youtube.com/shorts/bJ8KLIqvlfw?si=FO2w2M7kQTKCqgVy', // Cole o link do YouTube aqui
  'Panturrilha em pé': 'https://youtube.com/shorts/aK1imyBYXFc?si=nkdeVEGBR8qeFmtZ', // Cole o link do YouTube aqui
  'Panturrilha sentado': 'https://youtube.com/shorts/ciTzpPbR2WY?si=5kXkVkvAoAj21pvK', // Cole o link do YouTube aqui
  'Panturrilha no leg press': 'https://youtube.com/shorts/erUNxqpFxkc?si=Rucmjp-8XNxD8vlz', // Cole o link do YouTube aqui
  'Abdominal crunch': 'https://youtube.com/shorts/tfNa9GD6AQc?si=o-annqsTc_TlfwIS', // Cole o link do YouTube aqui
  'Elevação de pernas': 'https://youtube.com/shorts/NJoFF3O87Rs?si=lLixlpn1_5u-ne2O', // Cole o link do YouTube aqui
  'Prancha': 'https://youtube.com/shorts/aL3n2ah3KqI?si=yNoZVpbnZoTqZy6t', // Cole o link do YouTube aqui
  'Abdominal na polia': 'https://youtube.com/shorts/xVUoefhphK0?si=RPozcrfL1oYnE-Dn', // Cole o link do YouTube aqui
};

function getYoutubeEmbedUrl(link) {
  if (!link) return null;

  try {
    const url = new URL(link);
    const hostname = url.hostname.replace(/^www\./, '');
    let videoId = null;

    if (hostname === 'youtu.be') {
      videoId = url.pathname.split('/').filter(Boolean)[0];
    } else if (hostname === 'youtube.com' || hostname === 'youtube-nocookie.com') {
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (url.pathname === '/watch') {
        videoId = url.searchParams.get('v');
      } else if (['embed', 'shorts', 'live'].includes(pathParts[0])) {
        videoId = pathParts[1];
      }
    }

    return videoId && /^[\w-]{11}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : null;
  } catch {
    return null;
  }
}

export default function ExerciseVideo({ exerciseName, style, fallback = null }) {
  const embedUrl = getYoutubeEmbedUrl(exerciseYoutubeLinks[exerciseName]);

  if (!embedUrl) return fallback;

  return (
    <div style={{ width: '100%', height: '100%', ...style }}>
      <iframe
        src={embedUrl}
        title={`Demonstração de ${exerciseName}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        style={{ width: '100%', height: '100%', border: 0 }}
      />
    </div>
  );
}
