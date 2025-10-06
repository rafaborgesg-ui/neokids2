import React from 'react'

export const NeokidsMetaTags = () => {
  return (
    <>
      <title>Neokids - Sistema de Gestão Pediátrica</title>
      <meta name="description" content="Sistema completo de gestão para clínicas pediátricas com foco em Lean Healthcare e otimização da jornada do paciente." />
      <meta name="keywords" content="pediatria, gestão clínica, healthcare, sistema médico, lean healthcare, neokids" />
      <meta name="author" content="Neokids" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Favicon */}
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="alternate icon" href="/favicon.ico" />
      
      {/* Apple Touch Icon */}
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Neokids - Sistema de Gestão Pediátrica" />
      <meta property="og:description" content="Sistema completo de gestão para clínicas pediátricas com foco em Lean Healthcare e otimização da jornada do paciente." />
      <meta property="og:image" content="/og-image.png" />
      <meta property="og:url" content="https://neokids.com" />
      <meta property="og:site_name" content="Neokids" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content="Neokids - Sistema de Gestão Pediátrica" />
      <meta property="twitter:description" content="Sistema completo de gestão para clínicas pediátricas com foco em Lean Healthcare e otimização da jornada do paciente." />
      <meta property="twitter:image" content="/twitter-image.png" />
      
      {/* Theme color */}
      <meta name="theme-color" content="#2563eb" />
      <meta name="msapplication-TileColor" content="#2563eb" />
      
      {/* PWA */}
      <link rel="manifest" href="/manifest.json" />
      
      {/* Preconnect to external resources */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </>
  )
}

// Componente para ser usado no layout principal
export const NeokidsHead = () => {
  React.useEffect(() => {
    // Set document title dynamically
    document.title = 'Neokids - Sistema de Gestão Pediátrica'
    
    // Set favicon dynamically if needed
    const setFavicon = () => {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link')
      link.type = 'image/svg+xml'
      link.rel = 'icon'
      link.href = '/favicon.svg'
      document.getElementsByTagName('head')[0].appendChild(link)
    }
    
    setFavicon()
  }, [])

  return null
}