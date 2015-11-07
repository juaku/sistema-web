# Rutas
## Público
| Acción | Método | Ruta | Ejemplo |
| --- | --- | --- | --- |
| Mejores posts | GET | `/` | `.com/` |
| Posts por evento | GET | `/@:event` | `/@oscars` |
| Un post en particular | GET | `/:user-name@:event/[time]#[hash]` |	`/rodrigo@oscars/1444828491#f5c69a` |

## Privado
| Acción | Método | Ruta |
| --- | --- | --- |
| Mejores posts | GET | `/list/post/:i?` |
| Post de `seguidos` | GET | `/list/post/following/:i?` |
| Post por `evento` | GET | `/list/post/event/:event-id/:i?` |
| Post por `usuario` | GET | `/list/post/user/:user-id/:i?` |
| Mejores eventos | GET | `/list/event/:i?` |
| Eventos sugeridos | GET | `/list/event/suggested/:query?/:i?` |
| Seguidores | GET | `/list/user/followers` |
| Siguiendo | GET | `/list/user/following` |
| Postear un `post` | POST | `/post/new {post-object}` |
| Dar like a un `post` | PUT | `/post/like {post-id}` |
| Dar unlike a un `post` | PUT | `/post/unlike {post-id}` |
| Denunciar un `post` | PUT | `/post/report {post-id}` |
| Compartir un `post` | PUT | `/post/share {post-id}` |
| Información de usuario | GET | `/user/info` |
| Seguir `usuario` | PUT | `/user/follow {user-id}` |
| Dejar de seguir `usuario` | PUT | `/user/unfollow {user-id}` |
| Bloquear `usuario` | PUT | `/user/block {user-id}` |
| Desbloquear `usuario` | PUT | `/user/unblock {user-id}` |
| Preguntar ubicación a `usuario` | PUT | `/user/ask-location {user-id}` |
| Compartir perfil | PUT | `/user/share` |
| Cambiar idioma | PUT | `/user/change-language {language-id}` |
| Obtener sesión | GET | `/user/session` |
| Buscar | GET | `/search/:query/:i?` |
| Iniciar sesión | GET | `/login` |
| Cerrar sesión | GET | `/logout` |
