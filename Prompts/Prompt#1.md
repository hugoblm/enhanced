❯ Je souhaite créer une nouvelle application web en next. L'application se veut relativement simple dans un premier temps. Ton rôle est dans un premier temps de me challenger sur la stack a adopter pour ce nouveau produit. Les éléments sur et validés dans un premier temps :
  - BDD : Supabase
  - CI/CD : Github + Vercel
  - Analytics : Posthog
  - Provider Ai : OpenRouter

Voici le brief de ce qu'on aimerait construire : 

## Enhanced — Product Brief

---

### Le problème

L'IA permet de builder 10x plus vite. Elle ne permet pas de builder 10x mieux.

Le résultat : les équipes produisent plus de features, pas plus de valeur. La décision de builder reste la moins rigoureuse de tout le processus produit — elle naît d'une conversation orale, d'une intuition, d'une demande commerciale — et n'est jamais formellement challengée avant que le code soit écrit.

Le vrai coût d'une mauvaise feature n'est pas dans le build. Il est dans la maintenance permanente, la confusion UX qu'elle crée, l'opportunité manquée, et l'impossibilité politique d'y revenir.

---

### La solution

**Enhanced** est un wizard conversationnel qui guide les équipes produit à travers une validation structurée de leurs hypothèses avant de builder. Il pose les bonnes questions, challenge avec de la data réelle quand elle est disponible, et produit un draft PRD clair — honnête sur ce qui est prouvé, sur ce qui ne l'est pas encore, et sur ce qu'il faudra démontrer avant d'écrire la première ligne de code.

Il ne remplace pas la réflexion du PM. Il la force.

---

### Ce qu'Enhanced n'est pas

Il n'est pas un outil de gestion de backlog. Il n'est pas un générateur de specs techniques. Il n'est pas un dashboard analytics. Il n'est pas un outil de planification de sprint.

Il vit **avant** tous ces outils. Son output n'est pas un ticket — c'est un document de discovery. Un ticket signifie *"on le fait"*. Un draft PRD signifie *"on sait pourquoi ça mérite d'être exploré, et voilà ce qu'il reste à prouver."*

---

### Comment ça marche

Le wizard suit le framework FOCUSED en **4 étapes resserrées.**

---

**① Cadrage du problème**

Le PM décrit son idée en langage libre — aussi vague soit-elle. Enhanced reformule immédiatement la demande en problème utilisateur structuré via le format *First Use Case* :

> *Je suis un [profil], et quand je [contexte], ce qui compte c'est [besoin], mais en réalité [friction], et donc je dois [workaround].*

Si l'idée est formulée comme une solution (*"on devrait faire du temps réel"*), l'IA la recadre en problème avant d'aller plus loin. L'OKR ou la priorité company associée est identifiée. Le périmètre et les exclusions sont posés.

---

**② Validation par la data**

Enhanced interroge les outils analytics connectés via MCP — PostHog, Mixpanel, Amplitude — pour confronter l'hypothèse à la réalité :

- Existe-t-il un signal comportemental qui confirme la friction ?
- Quelle est la taille réelle du segment concerné ?
- Y a-t-il une corrélation avec une métrique clé — rétention, activation, NPS ?

Si aucun outil n'est connecté, Enhanced ne bloque pas. Il indique précisément quelles données seraient pertinentes pour valider l'hypothèse, comment les collecter, et comment les interpréter. Le PM fait le travail — l'outil donne la direction.

Dans les deux cas, le draft PRD est explicit sur ce qui est prouvé par la data et ce qui reste une hypothèse.

---

**③ Challenge des risques**

Enhanced évalue les 4 risques fondamentaux avant tout build :

- **Valeur** — Est-ce que les utilisateurs vont réellement s'en servir ?
- **Utilisabilité** — Sauront-ils comment s'en servir ?
- **Faisabilité** — L'équipe peut-elle le builder ?
- **Viabilité business** — Est-ce que ça fonctionne pour l'entreprise ?

Un score de confiance global est calculé. Enhanced formule une recommandation explicite : builder, tester d'abord via un fake door ou une interview, ou abandonner l'hypothèse. La recommandation est argumentée, pas autoritaire — le PM reste décisionnaire.

---

**④ Génération du draft PRD**

Enhanced produit un document structuré hébergé sur enhanced.pm, comprenant :

- Le problème utilisateur formalisé
- Le contexte data — signaux confirmés, données manquantes, méthodes de collecte suggérées
- L'évaluation des 4 risques
- Le score de confiance de l'hypothèse
- Les critères de succès mesurables
- Les kill criteria datés — les conditions explicites sous lesquelles l'idée sera abandonnée
- Les prochaines étapes recommandées avant de builder

Le document est partageable, commentable, et évolutif. Il se met à jour au fil de la discovery — interviews réalisées, tests menés, nouvelles données collectées. Il ne devient un ticket que lorsque l'équipe considère l'hypothèse suffisamment validée pour s'engager. Cette décision reste humaine.

---

### Pour qui

Les PMs et équipes produit en startup et scale-up qui utilisent déjà des outils analytics (PostHog, Mixpanel, Amplitude) et qui buildent de plus en plus vite sous l'effet de l'IA — sans nécessairement mieux valider ce qu'elles décident de builder.

---

### Les intégrations au lancement

| Rôle | Outils |
|---|---|
| Source de data | PostHog, Mixpanel, Amplitude |
| Framework embarqué | FOCUSED |
| Output | Draft PRD hébergé sur enhanced.pm |

*L'intégration Linear / Jira — push du ticket depuis le PRD validé — est prévue en V2, une fois la phase de discovery complétée.*

---

### La métrique de succès d'Enhanced

Le nombre de mauvaises features **non buildées** parce que l'hypothèse n'était pas assez solide. Pas le nombre de PRDs générés. Pas le nombre de tickets créés. Le nombre d'idées arrêtées au bon moment.

---

### La promesse

> **Enhanced transforme une idée orale en draft PRD structuré et challengé par la data — pour que ton équipe sache exactement ce qu'elle sait, ce qu'elle ne sait pas encore, et ce qu'il faudra prouver avant de builder.**
