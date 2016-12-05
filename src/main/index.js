import CommonNotify from '../common/notify';
import Step         from '../step';
import Notify       from '../notify';
class Main extends CommonNotify {
  constructor (opt) {
    super(opt);
    this.config = opt.config;
  }

  async exec () {
    const config = this.config;
    const notify = new Notify({ config });
    notify.init();
    const step   = new Step({ config });
    await step.exec();
    this.successNotify();
  }
}

export default Main;
