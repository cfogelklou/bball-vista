let inst: any = null;
class WebNavigator {
  history: any;

  constructor() {
    inst = this;
  }

  setHistory(history: any) {
    this.history = history;
  }

  navigate(where: string) {
    console.log("Navigating to ..." + where);
    this.history.push("/" + where);
  }

  static getInst(): WebNavigator {
    if (null === inst) {
      inst = new WebNavigator();
    }
    return inst;
  }
}

export default WebNavigator;
