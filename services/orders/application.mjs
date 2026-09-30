import { randomUUID } from 'node:crypto';
import { requireValue, validateItems } from '../../shared/domain.mjs';
// Application orchestration. Ports are injected; domain logic knows no HTTP or SQL.
export class Orders {
  constructor(repository,{quote,charge,notify}) {this.repository=repository;this.quote=quote;this.charge=charge;this.notify=notify;this.running=new Map();}
  list(userId) {return this.repository.list().filter(x=>x.userId===userId);}
  async create(userId,items,key) {
    validateItems(items);requireValue(typeof key==='string' && /^[a-zA-Z0-9-]{8,80}$/.test(key),'Falta Idempotency-Key válido');
    const id=`${userId}:${key}`;const fingerprint=JSON.stringify(items);
    if(this.running.has(id)) {const existing=await this.running.get(id);requireValue(existing.fingerprint===fingerprint,'Clave usada con otro carrito',409);return existing;}
    const work=this.execute(id,userId,items,fingerprint);this.running.set(id,work);
    try {return await work;} finally {this.running.delete(id);}
  }
  async execute(id,userId,items,fingerprint) {
    let order=this.repository.get(id);
    if(order) requireValue(order.fingerprint===fingerprint,'Clave usada con otro carrito',409);
    else {
      const lines=await this.quote(items);const total=lines.reduce((sum,line)=>sum+line.unitPrice*line.quantity,0);
      order=this.repository.put({id,orderId:randomUUID(),userId,fingerprint,items:lines,total,status:'pending-payment',createdAt:new Date().toISOString()});
    }
    if(order.status==='pending-payment') {
      await this.charge({orderId:order.orderId,userId,total:order.total,amount:order.total});
      order=this.repository.put({...order,status:'paid',notificationStatus:'pending'});
    }
    if(order.notificationStatus!=='delivered') {
      try {await this.notify({orderId:order.orderId,userId,total:order.total});order=this.repository.put({...order,notificationStatus:'delivered'});}
      catch { /* A paid order remains paid; replay safely retries the notification. */ }
    }
    return order;
  }
}
