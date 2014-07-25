# Manual de buenas prácticas
## Programación
### Comentarios
Se deben usar tantos comentarios como sean necesarios para garantizar que cualquier desarrollador, nuevo o familiarizado con el proyecto, pueda comprender cada segmento del código. El idioma a utilizar para los comentarios es el Español.

Para describir un segmento de código se colocará en la parte superior del mismo un bloque de texto que contenga la siguiente información:

| Identificadores | Significado |
| --- | --- | 
| `@descrip` | Descripción del bloque de código |
| `@param {tipo}` | Listado y descripción de argumentos necesarios, se escribirá una de estas líneas por argumento. Ejemplo: `@param {string} Nombre del usuario que...` |
| `@return {tipo}` | Descripción del valor de retorno. Ejemplo: `@return {function(id:string, userDetail:object)} Retorna una función que...` |

