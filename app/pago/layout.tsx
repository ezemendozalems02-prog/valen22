const META_PIXEL_ID = "1753795619133410";

const pixelBase = `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');
`;

/**
 * El Meta Pixel se carga solo en las páginas de resultado de pago (acá se
 * dispara el evento Purchase). La landing estática tiene su propia copia en
 * public/index.html, y el panel /admin queda afuera a propósito.
 */
export default function PagoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <script dangerouslySetInnerHTML={{ __html: pixelBase }} />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
