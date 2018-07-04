const actions = {
    RESET: 'RESET',
    INCREMENT: 'INCREMENT',
    DECREMENT: 'DECREMENT'
}

const reducer = function(state, action) {

    console.log("reducer", state, action);

    if (typeof state === 'undefined') {
        return { count : 0 };
    }

    switch (action) {
        case actions.RESET:
            return { count : 0 };
        case actions.INCREMENT:
            return { count : state.count + 1 };
        case actions.DECREMENT:
            return { count : state.count - 1 };
        default:
            return { count : state.count };
    }
}

const store = new StateManager("counter", { count: 0 }, reducer);
