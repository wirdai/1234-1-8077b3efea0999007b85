import { app, InvocationContext } from "@azure/functions";
import * as https from "https";
import * as df from "durable-functions";
import { ActivityHandler, OrchestrationContext, OrchestrationHandler } from "durable-functions";
import { Engine } from "json-rules-engine";

const defineEngine = () => {
    const engine = new Engine()

    engine.addOperator('es', (factValue, jsonValue) => {
        return true
    })
    engine.addOperator('contiene', (factValue, jsonValue) => {
        return true
    })

    return engine
}

msg.Categoria = yield context.df.callActivity('Classify', msg.text);
let engine = new Engine() 
const rule0 = {
  "conditions": {
    "all": [
      {
        "any": [
          {
            "all": [
              {
                "fact": "Categoria",
                "operator": "notEqual",
                "value": "Fraude"
              }
            ]
          },
          {
            "all": [
              {
                "fact": "Categoria",
                "operator": "equal",
                "value": "Posible Fuga"
              },
              {
                "fact": "Categoria",
                "operator": "equal",
                "value": "Oportunidad Comercial"
              }
            ]
          }
        ]
      },
      {
        "all": []
      }
    ]
  },
  "event": {
    "type": "Rule1",
    "params": {
      "actions": [
        {
          "type": "derivar",
          "params": {
            "to": "Pedro"
          }
        }
      ]
    }
  }
};
engine.addRule(rule0);

const {
    results,         // rule results for successful rules
    failureResults,  // rule results for failed rules
    events,          // array of successful rule events
    failureEvents,   // array of failed rule events
    almanac          // Almanac instance representing the run
} = await engine.run(msg);
if(results.length > 0){
    const to = events[0].params.actions[0].params.to
    yield context.df.callActivity('Derive', {to: to, msg: msg});
}

export async function serviceBusQueueTrigger(message: unknown, context: InvocationContext): Promise<void> {
    context.log('Service bus queue function processed message:', message);
    const client = df.getClient(context);
    const instanceId: string = await client.startNew("startOrchestrator", message);
    context.log(`Started orchestration with ID = '${instanceId}'.`);
}
app.serviceBusQueue('orchestrator', {
    connection: 'azureQueueConnection',
    queueName: '1234-1-8077b3efea0999007b85',
    handler: serviceBusQueueTrigger,
    extraInputs: [df.input.durableClient()],
});