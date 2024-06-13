import { Injectable } from '@nestjs/common';
import { MessageDto } from './messageDto';
// import { CreateMLCEngine } from '@mlc-ai/web-llm';

@Injectable()
export class IaService {
    async onModuleInit() {
        await this.loadData();
      }
    async loadData(){
        const SELECTEDMODEL = "gemma-2b-it-q4f16_1-MLC-1k"
        const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
        const enigne = await CreateMLCEngine(
            SELECTEDMODEL,
            {
                initProgressCallback:(info)=>{
                    console.log("initinitProgressCallback",info)
                }
            }
        )
    }
    async sendMessage (message:MessageDto){
     
    }
}
