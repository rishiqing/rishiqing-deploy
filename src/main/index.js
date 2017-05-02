import Step from '../step';
class Main {
  constructor (opt) {
    this.config = opt.config;
  }

  async exec () {
    const config = this.config;
    const step   = new Step({ config });
    await step.exec();
  }
}

export default Main;
