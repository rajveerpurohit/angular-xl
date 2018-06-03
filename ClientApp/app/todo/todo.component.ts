import { Component, OnInit, ElementRef } from '@angular/core';

import { WebApiService } from '../common/services/web-api.service';
import 'rxjs/add/operator/map';

@Component({
  selector: 'uwwb-todo',
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.less']
})
export class TodoComponent implements OnInit {

  constructor(private _webapi: WebApiService, private elementRef: ElementRef) { }

  ngOnInit() {
  	this.getTodos();
  }
  dataSource:any[];
  todos:any[];
  filteredTodos:any[];
  todosCount:number;
  filterColumn: string = null;
  savedFilters = [];
  currentFilter = {};
  filterControlPosition = 0;
  popovershow: boolean = false;
  selectedIndex: any = '';

  getTodos = (): void => {
        let url = '/assets/json/Todo/todo.json';
        this._webapi.get(url).map(res => res.json()).subscribe(
            (data) => {
              this.dataSource = data
              this.todos = this.dataSource;
              console.log(this.todos);
              if (this.todos) {
                  this.todosCount = this.todos.length;
              }
            },
            (err) => console.log(err.text())
        );
  }
  showPopover(element: any, filterColumn: string) {
      element.preventDefault();
      let exist = false;
      if (filterColumn) {
          this.filterColumn = filterColumn;
      }
      this.savedFilters.forEach((filter) => {
              if(Object.keys(filter)[0] === filterColumn) {
                  exist = true;
                  this.currentFilter = filter;
              }
          });
      if (!exist) {       
          let filterCriteria = {[filterColumn]: ''};
          console.log(filterCriteria);
          this.savedFilters.push(filterCriteria);
          this.currentFilter = filterCriteria;
      }
      this.togglePopover();
      //this.filteredData = [];
      this.filterControlPosition = element.clientX;
  }
  togglePopover =  ()  =>  {
      if (!this.popovershow) {
          this.popovershow  =  !this.popovershow;
          console.log('here');
      } else {
          const txtSearchName = this.elementRef.nativeElement.querySelector('#txtSearchName');
          txtSearchName.value = '';
          if (this.currentFilter[this.filterColumn] === '') {
              //this.disableClearFilter();
          } else if (this.currentFilter[this.filterColumn]) {
              //this.enableClearFilter();
              txtSearchName.value = this.currentFilter[this.filterColumn];
          }
          this.popovershow  =  !this.popovershow;
      }
  }
  disableClearFilter = () => {
      (<HTMLElement>document.querySelector(".clearLink")).style.cursor = "cursor";
      (<HTMLElement>document.querySelector(".clearLink")).style.pointerEvents = "none";
      (<HTMLElement>document.querySelector(".clearLink")).style.color = "#484848";
  }
  enableClearFilter = () => {
      (<HTMLElement>document.querySelector(".clearLink")).style.cursor = "hand";
      (<HTMLElement>document.querySelector(".clearLink")).style.pointerEvents = "auto";
      (<HTMLElement>document.querySelector(".clearLink")).style.color = "#21409A";
  }
  cancelPopover = () => {
      this.popovershow  =  !this.popovershow;
  } 
  
  clearfilter = (todos: any,e): void =>{
      e.preventDefault();
      this.currentFilter[this.filterColumn] = '';
      this.todos = todos;
      this.cancelPopover();
  }
  onFilterChange = (event): void => {
      let txt = event.target.value.toLowerCase();
      this.currentFilter[this.filterColumn] = txt;
      this.filteredTodos = [];
      this.dataSource.forEach((todo) => {
        if(todo[this.filterColumn].toLowerCase().indexOf(txt) >=0) {
          this.filteredTodos.push(todo);
          console.log(this.filteredTodos)
        } 
      });
      if(event.which === 13) {
          //this.onFilterSelction(null);
      }
    if(this.currentFilter[this.filterColumn]) {
         this.enableClearFilter();
      }
  }
  onFilterSelction = (todo: any): void => {
      if (this.filteredTodos) {
          if (todo) {
              // send single element
              this.filteredTodos = [];
              this.filteredTodos.push(todo);
          }
          //this.filterCriteria.emit(this.filteredData);
          this.todos = this.filteredTodos;
          this.filteredTodos = [];
          this.cancelPopover();
      }
  }

}
