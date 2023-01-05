// SPDX-License-Identifier: None
pragma solidity 0.8.7;
contract LoanStateMachine {

    enum State{
        PENDING,
        ACTIVE,
        CLOSED
    }

    State public state = State.PENDING;
    uint public amount;
    uint public interest;
    uint public end;
    uint public duration;
    address payable public borrower; 
    address payable public lender; 

    constructor(uint _amount, uint _interest, uint _duration, address payable _borrower, address payable _lender){
        amount = _amount;
        interest = _interest;
        end = (block.timestamp + (86400 * _duration)) * 1000;
        duration = _duration;
        borrower = _borrower;
        lender = _lender;
    }

    function fund() payable external{
        require(msg.sender == lender, "Only lender can lend");
        require(address(this).balance == amount, "Can only lend the exact amount");
        _transitionTo(State.ACTIVE);
        borrower.transfer(amount);
    }

    function reimburse() payable external{
        require(msg.sender == borrower, "Only borrower can reimburse");
        require(msg.value == amount + interest, "Borrower need to reimburse exactly amount + interest");
        _transitionTo(State.CLOSED);
        lender.transfer(amount + interest);
    }

    function _transitionTo(State toState ) internal{
        require(toState != State.PENDING, "Cannot go back to pending state");
        require(toState != state, "Cannot transition do current state");
        if(toState == State.ACTIVE){
            require(state == State.PENDING, "Only transition to active from pending state");
            state = State.ACTIVE;
        }
        if(toState == State.CLOSED){
            require(state == State.ACTIVE, "Can only transition to close  from active");
            require(block.timestamp >= end + duration, "Loan has not matured yet");
            state = State.CLOSED;
        }
    }
}

