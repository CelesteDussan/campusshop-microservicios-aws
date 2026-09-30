import { Catalog } from './application.mjs';
import { SqliteRepository } from '../../shared/repository.mjs';
import { serve } from '../../shared/http.mjs';
import { secret } from '../../shared/security.mjs';
const repository=new SqliteRepository(process.env.DB_PATH ?? 'data/catalog.sqlite');const app=new Catalog(repository);
serve({name:'catalog',port:process.env.PORT ?? 3002,repository,internalSecret:secret('INTERNAL_SECRET'),routes:[
  {method:'GET',path:'/products',handle:()=>app.list()},
  {method:'POST',path:'/quote',access:'internal',handle:({body})=>app.quote(body.items)}
]});
