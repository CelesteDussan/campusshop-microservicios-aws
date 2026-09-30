import { requireValue } from '../../shared/domain.mjs';
export class Payments {
  constructor(repository) {this.repository=repository;}
  charge({orderId,userId,amount}) {
    requireValue(typeof orderId==='string' && typeof userId==='string' && Number.isSafeInteger(amount) && amount>0,'Pago inválido');
    const prior=this.repository.get(orderId);
    if(prior) {requireValue(prior.userId===userId && prior.amount===amount,'Pago incompatible',409);return prior;}
    return this.repository.put({id:orderId,userId,amount,status:'simulated-approved',createdAt:new Date().toISOString()});
  }
  list(userId) {return this.repository.list().filter(x=>x.userId===userId);}
}
