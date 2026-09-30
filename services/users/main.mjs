import { Users } from './application.mjs';
import { SqliteRepository } from '../../shared/repository.mjs';
import { serve } from '../../shared/http.mjs';
import { secret } from '../../shared/security.mjs';
const repository=new SqliteRepository(process.env.DB_PATH ?? 'data/users.sqlite');
const tokenSecret=secret('TOKEN_SECRET'); const app=new Users(repository,tokenSecret);
serve({name:'users',port:process.env.PORT ?? 3001,repository,tokenSecret,routes:[
  {method:'POST',path:'/register',status:201,handle:({body})=>app.register(body)},
  {method:'POST',path:'/login',handle:({body})=>app.login(body)},
  {method:'GET',path:'/me',access:'user',handle:({user})=>({id:user.sub,name:user.name})}
]});
