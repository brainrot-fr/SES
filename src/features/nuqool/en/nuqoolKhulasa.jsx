import React, { useState, useCallback } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
// Constants live in nuqool.jsx — import from there, don't duplicate them here
import { KHUDA_T, R_SAWS, MAS, HBM, BM } from './nuqool.jsx';
import './nuqoolKhulasa.css';
import naql2 from '../../../assets/nuqool/en/Naql 2.jpeg';

function ImageSummary({ label, src, alt }) {
  const [open, setOpen] = useState(false);
  const openLightbox = useCallback((event) => {
    event.preventDefault();
    setOpen(true);
  }, []);
  const closeLightbox = useCallback(() => setOpen(false), []);

  return (
    <>
      <details className="nuqool-khulasa__details">
        <summary className="nuqool-khulasa__summary" onClick={openLightbox}>
          {label}
        </summary>
      </details>

      <Lightbox
        open={open}
        close={closeLightbox}
        slides={[{ src, alt, width: 2048, height: 2048 }]}
        plugins={[Zoom]}
        zoom={{
          scrollToZoom: true,
          pinchZoomV4: true,
          maxZoom: 16,
          wheelZoomDistanceFactor: 0.02,
        }}
        render={{
          buttonPrev: () => null,
          buttonNext: () => null,
        }}
      />
    </>
  );
}

export { KHUDA_T, R_SAWS, MAS, HBM, BM };

export const nuqoolKhulasaObject = {
  1: (
    <>
      <details>
        <summary>Khulasa</summary>
      </details>
    </>
  ),
  2: (
    <>
      <ImageSummary label="Khulasa" src={naql2} alt="Naql 2" />
    </>
  ),
  3: (
    <>
      <details>
        <summary />
      </details>
    </>
  ),
};

export default nuqoolKhulasaObject;
