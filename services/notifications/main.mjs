import { Notifications } from './application.mjs';
import { SqliteRepository } from '../../shared/repository.mjs';
import { serve } from '../../shared/http.mjs';
import { secret } from '../../shared/security.mjs';
const repository=new SqliteRepository(process.env.DB_PATH ?? 'data/notifications.sqlite');const app=new Notifications(repository);
serve({name:'notifications',port:process.env.PORT ?? 3005,repository,tokenSecret:secret('TOKEN_SECRET'),internalSecret:secret('INTERNAL_SECRET'),routes:[
  {method:'POST',path:'/deliver',access:'internal',handle:({body})=>app.deliver(body)},
  {method:'GET',path:'/notifications',access:'user',handle:({user})=>app.list(user.sub)}
]});
