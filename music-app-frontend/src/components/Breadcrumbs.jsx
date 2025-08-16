import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Breadcrumbs = () => {
  // Uzimamo trenutnu putanju iz React Router-a
  const location = useLocation();

  // Delimo putanju po '/' i uklanjamo eventualne prazne segmente
  const pathnames = location.pathname.split('/').filter(x => x);
  
  // Ne prikazujemo breadcrumbs na root ("/") ili stranici za prijavu ("/auth")
  if (location.pathname === '/' || location.pathname === '/auth') {
    return null;
  }

  return (
    <div className="breadcrumbs">
      {/* Prva stavka je uvek Home */}
      <Link to="/home" className="breadcrumb-item">Home</Link>
      
      {pathnames.map((name, index) => {
        // Rekonstruišemo URL za trenutni deo putanje
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        // Da li je ovo poslednja stavka u breadcrumbs?
        const isLast = index === pathnames.length - 1;
        
        // Formatiramo naziv: menjamo '-' u razmake i veliko slovo na početku svake reči
        const formattedName = name
          .replace(/-/g, ' ')
          .replace(/\b\w/g, letter => letter.toUpperCase());
        
        return (
          <React.Fragment key={name}>
            {/* Separator između stavki */}
            <span className="breadcrumb-separator">/</span>

            {isLast ? (
              // Ako je poslednja stavka, prikaži je kao običan tekst (trenutna lokacija)
              <span className="breadcrumb-item current">{formattedName}</span>
            ) : (
              // Inače, stavku prikaži kao link
              <Link className="breadcrumb-item" to={routeTo}>
                {formattedName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Breadcrumbs;
