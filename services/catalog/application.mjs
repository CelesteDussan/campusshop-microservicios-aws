import { requireValue, validateItems } from '../../shared/domain.mjs';
export const seedProducts=[
  {id:'notebook',name:'Cuaderno de ideas',category:'Papelería',description:'80 hojas para diseñar tu próxima gran idea.',price:12500,icon:'📓'},
  {id:'coffee',name:'Café del Huila',category:'Cafetería',description:'Origen local, tostión media. Tu pausa favorita.',price:4500,icon:'☕'},
  {id:'bottle',name:'Botella Campus',category:'Accesorios',description:'Acero inoxidable para acompañarte todo el día.',price:32000,icon:'🥤'},
  {id:'pencils',name:'Kit creativo',category:'Papelería',description:'Lápices, resaltadores y muchas posibilidades.',price:18000,icon:'✏️'},
  {id:'bag',name:'Tote universitaria',category:'Accesorios',description:'Algodón reutilizable para tus esenciales.',price:25000,icon:'👜'},
  {id:'sandwich',name:'Sándwich de la casa',category:'Cafetería',description:'Un descanso fresco entre clases.',price:9500,icon:'🥪'}
];
export class Catalog {
  constructor(repository) {this.repository=repository; for(const product of seedProducts) if(!repository.get(product.id)) repository.put(product);}
  list() {return this.repository.list();}
  quote(items) {validateItems(items);return items.map(item=>{const product=this.repository.get(item.productId);requireValue(product,'Producto no encontrado',404);return {productId:product.id,name:product.name,unitPrice:product.price,quantity:item.quantity};});}
}
