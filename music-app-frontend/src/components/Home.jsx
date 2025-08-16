import React from 'react';
import Lottie from 'lottie-react';
import boyAnimation from '../assets/boy.json';

export default function Home() {
  return (
    <div className="home-container">
      <div className="home-content-wrapper">
        {/* Lottie animacija sa leve strane */}
        <div className="home-lottie">
          <Lottie
            animationData={boyAnimation}
            loop
            autoplay
            style={{ maxWidth: 350, width: '100%', height: 'auto' }}
          />
        </div>

        {/* Blok teksta sa desne strane */}
        <div className="home-text-block">
          {/* Naslovna slika generisana kao PNG */}
          <img
            src="/images/Welcome_to_Musify.png"
            alt="Welcome to Musify"
            className="home-heading-img"
          />

          {/* Podnaslov aplikacije */}
          <h2 className="home-subheading">Your ultimate music events hub</h2>
          {/* Paragraf sa opisom */}
          <p className="home-text">
            Discover, stream, and share an endless mix of music events and concerts from
            emerging and world‑famous artists—all in one place.
          </p>
        </div>
      </div>
    </div>
  );
}
