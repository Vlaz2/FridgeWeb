import { Component, OnInit } from '@angular/core';
import { ServerConnectionService } from '../../services/server-connection.service';
import { AlertManagerService } from '../../services//alert-manager.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { GenericResponse } from '../../models/generic-response';
import { DeleteMemberRequest } from '../../models/Requests/deleteMemberRequest';
import { StorehouseMember } from '../../models/storehouseMember';
import { AuthorizationService } from '../.././services/authorization.service';

@Component({
  selector: 'app-members',
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.css']
})
export class MembersComponent implements OnInit {

  public storehouseId: number;
  public storehouseMembers: StorehouseMember[];
  public displayedColumns: string[] = ['name','email'];

  constructor(private server: ServerConnectionService,
    private alertManager: AlertManagerService,
    private router: Router,
    private activateRoute: ActivatedRoute,
    private authorizationService:AuthorizationService) { }

  ngOnInit(): void {
    this.storehouseId = this.activateRoute.snapshot.params['id'];
    if (this.storehouseId != 0) {
      this.server.getQuery<GenericResponse<boolean>>('/storehouse/' + this.storehouseId + '/members').subscribe(data => {
       console.log(data.data);
        this.storehouseMembers =  data.data;
        let storehouseAdmin:StorehouseMember;
        let storehouseTemp:StorehouseMember;

        for (let i = 0; i < this.storehouseMembers.length ; i++) {
         if(this.storehouseMembers[i].isOwner){
          storehouseAdmin = this.storehouseMembers[i]; 
          storehouseTemp = this.storehouseMembers[0]; 
          this.storehouseMembers[0] = storehouseAdmin;
          this.storehouseMembers[i] = storehouseTemp;
         }
        }
      });
    }
  }

  isCurrentUserOwner(){
    if(this.storehouseMembers == null)
      return false;
    var user = this.authorizationService.getUserinfo();
    return user.email == this.storehouseMembers.find(x => x.isOwner).email;    
  }

  deleteMember(userToDeleteId: number) {
    var user = this.authorizationService.getUserinfo();

    let deleteMemberRequest = new DeleteMemberRequest();
    deleteMemberRequest.storehouseId = this.storehouseId;
    deleteMemberRequest.userToDeleteId = userToDeleteId;

    this.server.postQuery<GenericResponse<boolean>>('/storehouse/deletemember/', deleteMemberRequest).subscribe(data => {
      if (data.isSuccess) {
        this.ngOnInit();
        this.alertManager.showSuccess("Member was deleted successfully");
      }
      else {
        this.alertManager.showError(data.error.errorMessage);
      }
    });
  }

}
