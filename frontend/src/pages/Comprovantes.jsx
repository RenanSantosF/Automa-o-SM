import { useEffect } from 'react';
import Documentos from '../components/Documentos/Documentos';

const Comprovantes = () => {
  useEffect(() => {
    const scrollY = window.scrollY;

    // trava scroll do body (inclusive durante o zoom)
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      // restaura scroll ao sair da página
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  return (
    <div className="h-full w-full">
      <Documentos />
    </div>
  );
};

export default Comprovantes;
