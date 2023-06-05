export default Receiver;
/**
 * Does nothing but waits to be resolved or rejected by external code
 * (and also registers internal timings)
 * @template T
 * @extends Executor<T>
 */
declare class Receiver<T> extends Executor<T> {
    constructor(options: [executor: (resolve: import("@js-bits/xpromise").Resolve<unknown>, reject: import("@js-bits/xpromise").Reject, ...rest: unknown[]) => void, options?: {
        timings?: import("./executor.js").Timings;
        timeout?: number | import("@js-bits/timeout").default;
    }][1]);
}
import Executor from "./executor.js";
