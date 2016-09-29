/**
 * Created by pc on 9/24/16.
 */
import { Component } from '@angular/core';
@Component({
  selector: 'app',
  template: `
               <h1>My first Angular App</h1>
            `
})
export class AppComponent { }

@Component({
  selector: 'user-profile',
  template: '<div>{{user}}</div>'
})
export class UserComponent {
  user = 'pc'
}