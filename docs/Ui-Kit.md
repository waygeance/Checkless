  ## Recommended frontend stack                                                                        
                                                                                                       
  Your existing React/Vite/Tailwind application already has a strong base. I would use this focused    
  stack:                                                                                               
                                                                                                       
   Need                    Recommendation                Cost/license                 Why it fits      
  ━━━━━━━━━━━━━━━━━━━━━━  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ━━━━━━━━━━━━━━━━━━━━━━━━━━━  ━━━━━━━━━━━━━━━━━━
   Dashboard components    shadcn/ui                     Free, open source            Fully            
                                                                                      customizable     
                                                                                      source code      
  ──────────────────────  ────────────────────────────  ───────────────────────────  ──────────────────
   Accessible behavior     Radix Primitives              Open source                  Dialogs, tabs,   
                                                                                      menus, tooltips, 
                                                                                      focus management 
  ──────────────────────  ────────────────────────────  ───────────────────────────  ──────────────────
   Dashboard charts        Recharts through shadcn       Free/open source             Ratings, match   
                           Charts                                                     history,         
                                                                                      tournament       
                                                                                      standings        
  ──────────────────────  ────────────────────────────  ───────────────────────────  ──────────────────
   Icons                   Keep Lucide                   ISC                          Already          
                                                                                      installed;       
                                                                                      consistent and   
                                                                                      customizable     
  ──────────────────────  ────────────────────────────  ───────────────────────────  ──────────────────
   Game badges             Game-icons.net                CC BY 3.0                    Excellent for    
                                                                                      achievements and 
                                                                                      tournament       
                                                                                      emblems          
  ──────────────────────  ────────────────────────────  ───────────────────────────  ──────────────────
   Animation               Keep Motion/Framer Motion     MIT                          Already          
                                                                                      installed;       
                                                                                      sufficient for   
                                                                                      nearly all UI    
                                                                                      motion           
  ──────────────────────  ────────────────────────────  ───────────────────────────  ──────────────────
   Hand-drawn details      Rough.js                      MIT                          Chalk lines,     
                                                                                      sketch borders,  
                                                                                      underlines,      
                                                                                      arrows           
  ──────────────────────  ────────────────────────────  ───────────────────────────  ──────────────────
   Fonts                   Fontsource                    Open-source font packages    Self-hosted      
                                                                                      vintage          
                                                                                      typography       
  ──────────────────────  ────────────────────────────  ───────────────────────────  ──────────────────
   Paintings               Met and Rijksmuseum Open      Public domain/CC0            Authentic        
                           Access                                                     historical chess 
                                                                                      artwork          
                                                                                                       
  ## 1. Dashboard components: shadcn/ui                                                                
                                                                                                       
  shadcn/ui (https://ui.shadcn.com/docs) is the best foundation for this project because it gives you  
  editable component source rather than locking the design inside a package. It provides cards, tabs,  
  dialogs, sheets, tables, forms, progress bars, avatars, tooltips, dropdowns, and more.               
                                                                                                       
  Its free dashboard blocks (https://ui.shadcn.com/blocks) can provide the initial sidebar and page    
  structure, while the official documentation supports Vite projects                                   
  (https://ui.shadcn.com/docs/installation/vite).                                                      
                                                                                                       
  Suggested mapping:                                                                                   
                                                                                                       
  - Dashboard sidebar → Sidebar                                                                        
  - Casual/Ranked selector → Tabs                                                                      
  - 1s/3s/5s selector → ToggleGroup                                                                    
  - Player profile → Avatar, Badge, Progress                                                           
  - Recent games → Table                                                                               
  - Friend activity → ScrollArea, Popover                                                              
  - Incoming challenges → Card, Dialog                                                                 
  - Tournament creation → Form, Select, Calendar                                                       
  - Mobile navigation → Sheet                                                                          
  - Search → Command                                                                                   
                                                                                                       
  Underneath, shadcn can use Radix Primitives                                                          
  (https://www.radix-ui.com/primitives/docs/overview/introduction), which handles keyboard navigation, 
  focus management, ARIA behavior, dialogs, and menus while leaving visual styling under your control. 
                                                                                                       
  Important: the latest shadcn setup increasingly assumes Tailwind 4, while your project uses Tailwind 
  3.4. I would manually introduce selected components or test the initializer on a separate branch     
  before modifying the whole frontend.                                                                 
                                                                                                       
  ## 2. Charts and dashboard statistics                                                                
                                                                                                       
  Use shadcn’s chart components backed by Recharts for:                                                
                                                                                                       
  - Rating history                                                                                     
  - Games played per format                                                                            
  - Win/loss breakdown                                                                                 
  - Tournament progression                                                                             
  - Recent rating changes                                                                              
  - Match activity calendar                                                                            
                                                                                                       
  Tremor (https://www.tremor.so/) is another free, open-source React/Tailwind dashboard collection.    
  However, I would only borrow ideas or selected chart patterns from it. Using Tremor for the entire   
  dashboard would push the design toward a generic financial SaaS appearance.                          
                                                                                                       
  ## 3. Icons                                                                                          
                                                                                                       
  Keep Lucide (https://lucide.dev/) for interface navigation. It is already installed, tree-shakable,  
  customizable, and ISC-licensed.                                                                      
                                                                                                       
  Use it for:                                                                                          
                                                                                                       
  - Home                                                                                               
  - Games                                                                                              
  - Friends                                                                                            
  - Tournaments                                                                                        
  - Settings                                                                                           
  - Search                                                                                             
  - Notifications                                                                                      
  - Profile actions                                                                                    
                                                                                                       
  For achievements and decorative game badges, use Game-icons.net (https://game-icons.net/). It        
  currently offers thousands of downloadable SVGs, including chess, coffee, heraldry, trophies, clocks,
  crowns, books, and tavern-like symbols. Its CC BY 3.0 license requires credit to the original icon   
  authors, so add an /attributions page or a credits section in the footer. License details            
  (https://game-icons.net/about.html).                                                                 
                                                                                                       
  Do not mix Lucide and Game Icons in the same navigation area:                                        
                                                                                                       
  - Lucide = functional interface                                                                      
  - Game Icons = achievements, quests, trophies and decorative badges                                  
                                                                                                       
  ## 4. Animation                                                                                      
                                                                                                       
  You already have Framer Motion installed. The current Motion project remains free, MIT-licensed, and 
  designed for React UI animation. Motion documentation (https://motion.dev/).                         
                                                                                                       
  Good thematic animations:                                                                            
                                                                                                       
  - A chess piece slides into place when a route loads                                                 
  - Cards lift slightly like coasters on hover                                                         
  - Tournament posters unroll or fade in                                                               
  - Achievement badges receive a stamped reveal                                                        
  - A subtle coffee-steam animation appears behind the profile                                         
  - Rating numbers mechanically roll after a game                                                      
  - Quest completion draws a hand-sketched checkmark                                                   
  - The cooldown ring moves smoothly without excessive glow                                            
                                                                                                       
  Continue using canvas-confetti only for meaningful victories. Avoid continuous background animation— 
  it will make the café atmosphere feel like a casino.                                                 
                                                                                                       
  ## 5. Drawings and hand-made details                                                                 
                                                                                                       
  Rough.js (https://github.com/rough-stuff/rough) is an excellent thematic addition. It is             
  MIT-licensed, under 9 KB according to its documentation, and generates sketch-like Canvas or SVG     
  graphics.                                                                                            
                                                                                                       
  Use it selectively for:                                                                              
                                                                                                       
  - Chalkboard section dividers                                                                        
  - Hand-drawn arrows                                                                                  
  - Quest-path connectors                                                                              
  - Underlined headings                                                                                
  - Tournament brackets                                                                                
  - Coffee-stain-style circular frames                                                                 
  - “New” or “Live” annotations                                                                        
  - Empty-state illustrations                                                                          
                                                                                                       
  Do not render every card with Rough.js. A few imperfect details against otherwise clean UI will feel 
  intentional.                                                                                         
                                                                                                       
  ## 6. Historical paintings and artwork                                                               
                                                                                                       
  Avoid pulling images from Google Images, Pinterest, or random wallpaper sites. Use museum collections
  that explicitly identify reusable public-domain works.                                               
                                                                                                       
  Strong candidates:                                                                                   
                                                                                                       
  - The Chess Players by Thomas Eakins (https://www.metmuseum.org/art/collection/search/10813) — public
    domain and available for unrestricted use through The Met.                                         
                                                                                                       
  - De schaakspelers by Isaac Israels                                                                  
    (https://www.rijksmuseum.nl/en/collection/object/De%2Bschaakspelers--318863b8bc863e591a052324a024be06)                                                                                                    
    — public-domain pastel drawing.                                                                    
                                                                                                       
  - Men Playing Chess by Isaac Israels                                                                 
    (https://www.rijksmuseum.nl/en/collection/object/Men-playing-chess--783144ce7cf762a864106e1473f1fc74)                                                                                                     
    — public-domain watercolor/sketch.                                                                 
                                                                                                       
  - The Chess Players, historical reproduction                                                         
    (https://www.rijksmuseum.nl/en/collection/object/The-chess-players--e9a5aa36723c93762fa0a6e739a62cb6)                                                                                                     
    — public domain.                                                                                   
                                                                                                       
  - The Met Open Access collection (https://www.metmuseum.org/es/hubs/open-access) makes public-domain 
    artwork available under CC0.                                                                       
                                                                                                       
  - The Art Institute of Chicago API (https://api.artic.edu/docs/) supports filtering specifically for 
    public-domain works and retrieving appropriately sized images through IIIF.                        
                                                                                                       
  - Rijksmuseum Data Services (https://data.rijksmuseum.nl/about/) provides open metadata and          
    high-resolution images, using CC0 wherever possible.                                               
                                                                                                       
  Use paintings as:                                                                                    
                                                                                                       
  - Cropped hero backgrounds                                                                           
  - Tournament posters                                                                                 
  - Empty history-state artwork                                                                        
  - Desaturated dashboard panels                                                                       
  - Profile banner choices                                                                             
  - Loading-screen imagery                                                                             
                                                                                                       
  Store the selected images locally and keep a small metadata file recording title, artist, museum,    
  source URL, license, and alt text.                                                                   
                                                                                                       
  ## 7. Typography                                                                                     
                                                                                                       
  Use Fontsource (https://fontsource.org/) to self-host open-source fonts through npm.                 
                                                                                                       
  My recommended combination:                                                                          
                                                                                                       
  - Fraunces Variable — headings, tournament names, ratings                                            
  - IBM Plex Sans — interface labels and body text                                                     
  - IBM Plex Mono — cooldown timers, ratings, sequences                                                
                                                                                                       
  That creates an old printed-menu character while preserving dashboard readability.                   
                                                                                                       
  ## Proposed café design system                                                                       
                                                                                                       
  Roasted black     #130F0C                                                                            
  Espresso          #211611                                                                            
  Dark walnut       #3A251B                                                                            
  Coffee leather    #563727                                                                            
  Parchment         #E7D5B5                                                                            
  Aged cream        #F2E7CF                                                                            
  Antique brass     #B58A4A                                                                            
  Wine red          #8C4038                                                                            
  Absinthe lime     #C2D82E                                                                            
  Use lime only for actions, online state, cooldown completion, and positive rating changes. Brass     
  should handle prestige, trophies, and tournaments.

  Add:

  - Very subtle paper grain
  - Walnut-colored borders
  - Parchment cards
  - Engraved badge treatments
  - Coffee-ring marks in empty space
  - Paintings at low contrast
  - Solid backgrounds immediately behind text for accessibility

  ## What I would avoid

  - Material UI, Ant Design, or an entire Mantine theme: too difficult to make convincingly café-like. 
  - Multiple icon libraries across the same interface.
  - Generic blue/purple gradients.
  - Heavy glassmorphism.
  - Random “free” Lottie animations with unclear per-asset licensing.
  - Installing unreviewed community shadcn registries.
  - Excessive textures behind text.
  - Animating timers or chess pieces in ways that obscure authoritative game state.

  The best practical combination is:

  Tailwind
  + selected shadcn/Radix components
  + existing Lucide
  + existing Framer Motion
  + Recharts
  + Rough.js
  + Fontsource
  + carefully selected public-domain museum artwork

  That gives you a reusable dashboard system while preserving a unique old coffeehouse chess identity  
  instead of looking like a reskinned admin template.