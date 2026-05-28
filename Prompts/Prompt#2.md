❯ L'objectif est d'après ce brief de suivre les règles strict du claude.md avant l'implémentation d'une iniative a savoir la redaction du PRD, des users, des specs          
  technique etc etc en suivant les 5 étapes (Discovery, Gate, Initiative, features, Delivery). Redige toutes les documentations prévu par les templates et crée les          
  specifications techniques. Le Brief est complet il faudra donc le spliter en feature une fois l'initiative validée.                                                        
                                                                                                                                                                             
  As tu des questions ?                                                                                                                                                      
                                                                                                                                                                             
  Voici le brief :                                                                                                                                                           
                                                                                                                                                                             
  # Enhanced — Product Brief                                                                                                                                                 
                                                                                                                                                                             
  ## Contexte                                                                                                                                                                
                                                                                                                                                                             
  Première version d'Enhanced à livrer en V1 fonctionnelle pour une **démo en webinaire devant des PMs**. La V1 doit être complète sur l'expérience perçue, mais peut        
  exclure les intégrations externes lourdes (analytics, ticketing) qui seront ajoutées post-validation.                                                                      
                                                                                                                                                                             
  ## Le problème                                                                                                                                                             
                                                                                                                                                                             
  L'IA permet de builder 10x plus vite. Elle ne permet pas de builder 10x mieux.                                                                                             
                                                                                                                                                                             
  Les équipes produit produisent plus de features, pas plus de valeur. La décision de builder reste la moins rigoureuse de tout le processus produit — elle naît d'une       
  conversation orale, d'une intuition, d'une demande commerciale — et n'est jamais formellement challengée avant que le code soit écrit.                                     
                                                                                                                                                                             
  Le vrai coût d'une mauvaise feature n'est pas dans le build. Il est dans la maintenance permanente, la confusion UX qu'elle crée, l'opportunité manquée, et                
  l'impossibilité politique d'y revenir.                                                                                                                                     
                                                                                                                                                                             
  ## La solution                                                                                                                                                             
                                                                                                                                                                             
  **Enhanced** est un wizard conversationnel qui guide les équipes produit à travers une validation structurée de leurs hypothèses avant de builder. Il pose les bonnes      
  questions, challenge la logique du PM, et produit un draft PRD clair — honnête sur ce qui est prouvé, sur ce qui ne l'est pas, et sur ce qu'il faudra démontrer avant      
  d'écrire la première ligne de code.                                                                                                                                        
                                                                                                                                                                             
  Il ne remplace pas la réflexion du PM. Il la force.                                                                                                                        
                                                                                                                                                                             
  ## Ce qu'Enhanced n'est pas                                                                                                                                                
                                                                                                                                                                             
  Ce n'est pas un outil de gestion de backlog. Pas un générateur de specs techniques. Pas un dashboard analytics. Pas un outil de planification de sprint.                   
                                                                                                                                                                             
  Enhanced vit **avant** tous ces outils. Son output n'est pas un ticket — c'est un document de discovery. Un ticket signifie *"on le fait"*. Un draft PRD signifie *"on     
  sait pourquoi ça mérite d'être exploré, et voilà ce qu'il reste à prouver."*                                                                                               
                                                                                                                                                                             
  ## L'expérience utilisateur                                                                                                                                                
                                                                                                                                                                             
  ### Landing : démarrage sans friction                                                                                                                                      
                                                                                                                                                                             
  La home d'enhanced.pm est minimaliste. Pas de hero verbeux, pas de carrousel de témoignages, pas de "trusted by". Le produit *est* la landing.                             
                                                                                                                                                                             
  > **Pitche ton idée produit. On la transforme en draft PRD challengé.**                                                                                                    
  >                                                                                                                                                                          
  > *[grosse textarea]*                                                                                                                                                      
  >                                                                                                                                                                          
  > *[Lancer le cadrage]*                                                                                                                                                    
                                                                                                                                                                             
  Le PM tape son idée, clique, et bascule immédiatement dans le wizard. **Aucun signup demandé à ce stade.**                                                                 
                                                                                                                                                                             
  Le signup arrive **à la fin de l'étape 1**, quand le PM a déjà reçu sa première reformulation et investi 2-3 minutes. À ce moment, le wow effect est passé, le travail est 
   préservé côté serveur, et la conversion est dramatiquement plus élevée qu'en front-loading.                                                                               
                                                                                                                                                                             
  ### Split-view : conversation à gauche, artefact à droite                                                                                                                  
                                                                                                                                                                             
  Le wizard utilise une **vue scindée desktop** :                                                                                                                            
                                                                                                                                                                             
  - **À gauche** : la conversation avec l'IA. Pas un chat ouvert, une **extraction dirigée**. L'IA pose 2 à 3 questions ciblées par étape, alterne entre texte libre et      
  cartes interactives selon le besoin.                                                                                                                                       
  - **À droite** : le **draft PRD qui se construit en temps réel**. Chaque réponse du PM enrichit le PRD section par section, en direct sous ses yeux. Le PRD n'est jamais   
  "généré à la fin" — il existe dès la première interaction et grandit progressivement.                                                                                      
                                                                                                                                                                             
  Cette construction temps réel est non-négociable. Elle est le différentiateur visuel principal de la démo, et elle garantit qu'à n'importe quel moment où le webinaire     
  serait coupé, il y a déjà un artefact partiel à montrer.                                                                                                                   
                                                                                                                                                                             
  ### Le tool `ask_user` : interactions structurées                                                                                                                          
                                                                                                                                                                             
  Pour garder le contrôle du flow sans tomber dans le formulaire infantilisant, l'IA dispose d'un tool unique qui rend des **cartes de réponse structurées** dans la         
  conversation.                                                                                                                                                              
                                                                                                                                                                             
  Le LLM décide dynamiquement, en fonction de la question, du format approprié :                                                                                             
                                                                                                                                                                             
  - **Choix unique** (ex : *"Quel profil utilisateur ?"* → liste de 4-5 options + "Autre")                                                                                   
  - **Choix multiples** (ex : *"Quelles métriques surveilles-tu ?"*)                                                                                                         
  - **Échelle** (ex : *"Niveau de confiance faisabilité technique ? 1-5"*)                                                                                                   
  - **Confirmation** (ex : *"Cette reformulation te paraît juste ?"* → Oui / Reformule / Précise)                                                                            
  - **Texte libre** (par défaut quand la réponse est spécifique au contexte du PM)                                                                                           
                                                                                                                                                                             
  Garde-fous :                                                                                                                                                               
  - Toute carte à choix inclut systématiquement une option *"Autre — préciser"* qui ouvre une textarea.                                                                      
  - Maximum 2-3 cartes consécutives avant de repasser en texte libre.                                                                                                        
  - Chaque carte est précédée d'un message expliquant **pourquoi cette question** est posée. Pas de quiz aveugle.                                                            
                                                                                                                                                                             
  ### Édition du PRD : re-prompt par block                                                                                                                                   
                                                                                                                                                                             
  Le PM peut affiner n'importe quel block du PRD via un bouton `✨ Refine` qui apparaît au hover. Il décrit en langage naturel ce qu'il veut changer (*"raccourcis"*,        
  *"ajoute le contexte B2C"*, *"sois plus direct sur le risque viabilité"*), et l'IA regénère ce block uniquement.                                                           
                                                                                                                                                                             
  Pas d'éditeur WYSIWYG en V1. L'édition se fait par instruction, pas par sélection de texte.                                                                                
                                                                                                                                                                             
  ### Versioning léger                                                                                                                                                       
                                                                                                                                                                             
  Le PRD est versionné basiquement : chaque génération ou refine de block crée une nouvelle version stockée. Le PM peut consulter l'historique sans détail.                  
                                                                                                                                                                             
  ### Export PDF                                                                                                                                                             
                                                                                                                                                                             
  Le PRD finalisé est exportable en **PDF** depuis enhanced.pm. Le PDF est branded Enhanced, propre, partageable par email ou Slack.                                         
                                                                                                                                                                             
  Pas de Word, pas de docx. L'édition se passe sur enhanced.pm — le PDF est une snapshot pour communication externe, pas un livrable à éditer ailleurs.                      
                                                                                                                                                                             
  ### Partage public                                                                                                                                                         
                                                                                                                                                                             
  Chaque PRD peut être rendu public via un lien `enhanced.pm/p/[slug]` avec rendu SSR et meta tags Open Graph. Lecture seule, partageable au CEO ou à la team sans qu'ils    
  aient besoin de compte.                                                                                                                                                    
                                                                                                                                                                             
  ## Le wizard : 4 étapes                                                                                                                                                    
                                                                                                                                                                             
  ### ① Cadrage du problème                                                                                                                                                  
                                                                                                                                                                             
  Le PM décrit son idée en langage libre — aussi vague soit-elle. Enhanced reformule la demande en problème utilisateur structuré via le format **First Use Case** :         
                                                                                                                                                                             
  > *Je suis un [profil], et quand je [contexte], ce qui compte c'est [besoin], mais en réalité [friction], et donc je dois [workaround].*                                   
                                                                                                                                                                             
  Si l'idée est formulée comme une solution, l'IA la recadre en problème avant d'aller plus loin. L'OKR ou la priorité company associée est identifiée. Le périmètre et les  
  exclusions sont posés.                                                                                                                                                     
                                                                                                                                                                             
  ### ② Validation par la data (mode guidage manuel en V1)                                                                                                                   
                                                                                                                                                                             
  Sans connexion analytics en V1, Enhanced ne bloque pas. Il indique précisément :                                                                                           
                                                                                                                                                                             
  - Quelles données seraient pertinentes pour valider l'hypothèse                                                                                                            
  - Comment les collecter (queries à faire dans PostHog/Mixpanel/Amplitude, interviews à mener)                                                                              
  - Comment les interpréter                                                                                                                                                  
                                                                                                                                                                             
  Le PM répond avec ce qu'il sait déjà ou ce qu'il a vu. Toutes les assertions data sont taggées dans le PRD :                                                               
                                                                                                                                                                             
  - `[Evidence]` — appuyée par une donnée fournie                                                                                                                            
  - `[Assumption]` — hypothèse non confirmée                                                                                                                                 
  - `[To verify]` — à mesurer avant build                                                                                                                                    
                                                                                                                                                                             
  C'est cette honnêteté visible qui fait la différence avec un générateur de PRDs flou.                                                                                      
                                                                                                                                                                             
  ### ③ Challenge des risques                                                                                                                                                
                                                                                                                                                                             
  Enhanced évalue les **4 risques fondamentaux** :                                                                                                                           
                                                                                                                                                                             
  - **Valeur** — Est-ce que les utilisateurs vont réellement s'en servir ?                                                                                                   
  - **Utilisabilité** — Sauront-ils comment s'en servir ?                                                                                                                    
  - **Faisabilité** — L'équipe peut-elle le builder ?                                                                                                                        
  - **Viabilité business** — Est-ce que ça fonctionne pour l'entreprise ?                                                                                                    
                                                                                                                                                                             
  Pour chaque risque, l'IA propose une analyse et un score. Le PM peut accepter ou pousser back. Un **score de confiance global** est calculé. Enhanced formule une          
  **recommandation explicite** : builder, tester d'abord, ou abandonner. La reco est argumentée, pas autoritaire — le PM reste décisionnaire.                                
                                                                                                                                                                             
  ### ④ Draft PRD finalisé                                                                                                                                                   
                                                                                                                                                                             
  Enhanced finalise le draft PRD à partir des étapes précédentes. À ce stade, le document à droite contient déjà tout ce qui a été construit en temps réel pendant le        
  wizard. Structure complète :                                                                                                                                               
                                                                                                                                                                             
  - Problème utilisateur formalisé (First Use Case)                                                                                                                          
  - Contexte data — signaux confirmés, données manquantes, méthodes de collecte suggérées                                                                                    
  - Évaluation des 4 risques + scoring                                                                                                                                       
  - Score de confiance global                                                                                                                                                
  - Critères de succès mesurables                                                                                                                                            
  - **Kill criteria datés** — conditions explicites sous lesquelles l'idée sera abandonnée                                                                                   
  - Prochaines étapes recommandées avant de builder                                                                                                                          
                                                                                                                                                                             
  Le PRD est éditable par re-prompt, partageable, exportable.                                                                                                                
                                                                                                                                                                             
  ## Pour qui                                                                                                                                                                
                                                                                                                                                                             
  Les PMs et équipes produit en startup et scale-up qui buildent vite — souvent assistés par IA — sans nécessairement mieux valider ce qu'elles décident de builder. ICP     
  particulièrement aligné avec les équipes qui utilisent déjà des outils analytics (PostHog, Mixpanel, Amplitude), même si la V1 ne s'y connecte pas encore.                 
                                                                                                                                                                             
  ## Scope V1 vs V2                                                                                                                                                          
                                                                                                                                                                             
  | Capability | V1 (démo) | V2 |                                                                                                                                            
  |---|---|---|                                                                                                                                                              
  | Wizard 4 étapes + FOCUSED | ✓ | — |                                                                                                                                      
  | Split-view conversation + artefact temps réel | ✓ | — |                                                                                                                  
  | Tool `ask_user` + cartes structurées | ✓ | — |                                                                                                                           
  | Édition par re-prompt block-level | ✓ | — |                                                                                                                              
  | Export PDF + partage public | ✓ | — |                                                                                                                                    
  | Versioning basique (historique stocké) | ✓ | — |                                                                                                                         
  | Étape 2 en mode guidage manuel | ✓ | — |                                                                                                                                 
  | **Connexions MCP analytics** (PostHog/Mixpanel/Amplitude) | ✗ | ✓ |                                                                                                      
  | **Document vivant** (relancer une discovery sur PRD existant) | ✗ | ✓ |                                                                                                  
  | **Push vers Linear/Jira** | ✗ | ✓ |                                                                                                                                      
  | **Édition WYSIWYG inline** | ✗ | si demande |                                                                                                                            
                                                                                                                                                                             
  ## Métrique de succès d'Enhanced                                                                                                                                           
                                                                                                                                                                             
  Le nombre de mauvaises features **non buildées** parce que l'hypothèse n'était pas assez solide. Pas le nombre de PRDs générés. Pas le nombre de tickets créés. Pas le     
  nombre d'utilisateurs actifs. Le nombre d'idées arrêtées au bon moment.                                                                                                    
                                                                                                                                                                             
  Pour la démo webinaire, métrique opérationnelle : nombre de signups générés et nombre de drafts PRDs publics partagés dans les 48h suivant le webinaire.                   
                                                                                                                                                                             
  ## La promesse                                                                                                                                                             
                                                                                                                                                                             
  > **Enhanced transforme une idée orale en draft PRD structuré et challengé — pour que ton équipe sache exactement ce qu'elle sait, ce qu'elle ne sait pas encore, et ce    
  qu'il faudra prouver avant de builder.**