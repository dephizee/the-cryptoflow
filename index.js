	const contractSource = `
      contract Task_flow =
        record task_info = 
          {
            data : map(int, task),
            length : int
          }
        record task = 
          {
           name           : string,
           comment        : string,
           date           : string,
           duration       : int}
           
        record state = 
          {
            all_tasks: map(address, task_info)
           }
           
        entrypoint init() =
          { 
            all_tasks = {}
             }
        
        stateful entrypoint init_user() = 
          if( !Map.member(Call.caller, state.all_tasks) )
            let task_i = { data = {} , length = 0 }
            put(state{all_tasks[Call.caller] = task_i })
            
        stateful entrypoint add_task(name': string, comment': string, date': string, duration': int)= 
          let task = {  name = name', comment = comment', date = date', duration = duration'}
          let index = state.all_tasks[Call.caller].length
          let new_i = index + 1
          put(state{all_tasks[Call.caller].data[index] = task})
          put(state{all_tasks[Call.caller].length = new_i  })
          
        stateful entrypoint getLength() : int =
          Map.size(state.all_tasks)
          
        stateful entrypoint getTask(addr : address) : map(int, task) =
          if( Map.member(addr, state.all_tasks ) )
            state.all_tasks[addr].data
          else
            {}
            
        stateful entrypoint getAllTasksForAddress() : map(int, task)  =
          if( Map.member(Call.caller, state.all_tasks ) )
            state.all_tasks[Call.caller].data
          else
            {}
            
        stateful entrypoint getAllTask() : map(address, task_info ) =
          state.all_tasks
          
        stateful entrypoint deleteTask(index : int) =
          put(state{ all_tasks[Call.caller].data @ b = Map.delete(index, b) })
        `;
    const contractAddress = 'ct_zqhchWZEYwjJhpZbYVfVbfBzXeDNVeuinuXG3QBvobe1wRyjC';
// assigning needeed variables and objects
	var tmp_div = `<div class="col-offset- col-3 item task" >
              <div class="col-12 icon_container t_name">
                task name (start_date)
              </div>
              <div class="col-12 t_comment" >
                Comment
              </div>
              <div class="col-offset-6 col-6 g_started t_delete" style="color: #fff;" >
                Delete Task
              </div>
            </div>`;
			
	var panel = document.querySelector("div.panel");
	var display_panel = document.querySelector("div.display_panel");
	var show_panel = document.querySelector("div.show_panel");
	var spinner = document.querySelector(".spinner");
	var remove_panel = document.querySelector("#remove_panel");
	var add_task = document.querySelector("#add_task");
  // assigning event listeners appropraitely
	add_task.onclick = async (e)=>{

				if(validate()){
          spinner.style.marginTop = "50%";
					panel.style.marginTop = "-500px";
					
          var callset = await callNonStaticFunc('add_task', getNewTaskData(), 0);
          var tasks = await callFunc('getAllTasksForAddress', []);
          if (tasks==null) {
            alert("Unable to load");
          }else{

              populateTask(tasks);
          }
				}
			spinner.style.marginTop = "-500px";
		}
	show_panel.addEventListener('click', function() {
			panel.style.marginTop = "30px";
			})
	remove_panel.addEventListener('click', function() {
			panel.style.marginTop = "-500px";
			})
	var validate = ()=>{
    // little error checking and validation
		var v_node = document.querySelectorAll(".panel input[name]");
		for (var i = 0; i < v_node.length; i++) {
			if(v_node[i].value.length < 1){
				v_node[i].focus();
				alert("Empty field");
				return false;
				break;
			}
		}		
		return true;
	}
  function getNewTaskData(){
    //Fetch all data from form
    var arr = [];
    var v_node = document.querySelectorAll(".panel input[name]");
    for (var i = 0; i < v_node.length; i++) {
      arr[i] = v_node[i].value;
      v_node[i].value = "";
    }  
    console.log(arr.toString() ) ;
    return arr;
  }
	var renderTask  = (data) =>{
    // reassign variable for rendering
    var data_id = data[0];
    data = data[1];
    // then render to browser
		var t_div = new DOMParser().parseFromString(tmp_div, 'text/html');
		t_div = t_div.querySelector(".item");
		t_div.querySelector(".t_name").innerHTML = data.name +" ("+ data.date +")<br>"+data.duration+" day(s) ";
		t_div.querySelector(".t_comment").innerHTML = data.comment;
		t_div.querySelector(".t_delete").id = data_id;
		t_div.querySelector(".t_delete").onclick = async (e)=>{
				                          
        spinner.style.marginTop = "50%";
        var callset = await callNonStaticFunc('deleteTask', [e.target.id], 0);
        var tasks = await callFunc('getAllTasksForAddress', []);
        if (tasks==null) {
          alert("Unable to load");
        }else{

            populateTask(tasks);
        }
        spinner.style.marginTop = "-300px";
		}
		display_panel.appendChild(t_div);
  }
  var populateTask = (data)=>{
  	unpopulateTask();
    // populate the browser with data
		for (var i = 0; i < data.length; i++) {
			renderTask(data[i]);
		}
	}
	var unpopulateTask = ()=>{
    // removes all task currently being rendered
		var data = document.querySelectorAll(".task");
		for (var i = 0; i < data.length; i++) {
			display_panel.removeChild(data[i]);
		}
    	
	}
	
// 
// 
// 
// 
// 
  var client = null;
  
	async function callFunc(func, args){
    // got this from the tutorial static calls
    const contract = await client.getContractInstance(contractSource, {contractAddress});
    const calledGet = await contract.call(func, args, {callStatic: true}).catch(e => console.error(e));
    const decodedGet = await calledGet.decode().catch(e => console.error(e));
    return decodedGet;
  }
  async function callNonStaticFunc(func, args, value){
    // got this from the tutorial contract calls
    const contract = await client.getContractInstance(contractSource, {contractAddress});
    const calledSet = await contract.call(func, args, {amount: value}).catch(e => {
      console.error(e);
    });

    return calledSet;
  }
	var init = async ()=>{
    //intialize the client Obj 
		client = await Ae.Aepp();

    // the init_user function was created after i realized, nested intialization wasn't allowed
    // so the init function checks and initializes new addresses
    var init_user = await callNonStaticFunc('init_user', [], 0);

    // getAllTasksForAddress func returns all functions under the a user
    var tasks = await callFunc('getAllTasksForAddress', []);

    //little error checking
    if (tasks==null) {
      display_panel.style.display = "none";
      alert("Unable to load, Reload please");
    }else{
        display_panel.style.display = "block";
        if(tasks.length > 0){
          populateTask(tasks);
        }else{
          alert("No Task Found");
        }
        
    }
    spinner.style.marginTop = "-300px";
	}
  //starts the whole Ae App() js excution
	init();