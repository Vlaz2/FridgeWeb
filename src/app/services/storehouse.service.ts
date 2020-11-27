import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { from } from 'rxjs';
import { GenericResponse } from '../models/generic-response';
import { Storehouse } from '../models/storehouse'
import { AlertManagerService } from './alert-manager.service';
import { ServerConnectionService } from './server-connection.service';
import { Subject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class StorehouseService {

  private _storehouses: Storehouse[] = [];
  private _trigger = new Subject<void>();

  constructor(private server: ServerConnectionService, private alertManager: AlertManagerService) {
  }

  get trigger$() {
    return this._trigger.asObservable();
  }

  public triggerOnChangeSelectedStorehouse() {
    this._trigger.next();
  }

  public get selectedStorehouse():Storehouse {
    return this.selectedStorehouseInPanel();
  }

  public get storehouseInfoForCreateProductItem() {
    return this.getStorehouseInfoForCreateProductItem();
  }

  get storehouses(): Storehouse[] {
    if (this._storehouses.length == 0) {
      this.downloadStorehouses();
    }

    return this._storehouses;
  }

  get isEmpty(): boolean {
    return this.storehouses.length == 0;
  }

  private selectedStorehouseInPanel(){
    let storehouse = localStorage.getItem("SelectedStorehouseInPanel");
    return JSON.parse(storehouse);
  }

  public getColorOfHeader(): string {
    return localStorage.getItem("colorOfHeader");
  }

  public dropColorOfHeader(): void {
    localStorage.removeItem("colorOfHeader");
  }

  public downloadStorehouses(): void {
    this.server.getQuery<GenericResponse<boolean>>('/storehouse').subscribe(data => {
      if (data.isSuccess) {
        this._storehouses = data.data;
      }
      else {
        this.alertManager.showError(data.error.errorMessage);
      }
    });
  }

  async getStorehousesAsync() {
    var data = await this.server.getQueryPromise<GenericResponse<boolean>>('/storehouse');

    if (data.isSuccess) {
      this._storehouses = data.data;
    }
    else {
      this.alertManager.showError(data.error.errorMessage);
    }

    if (this._storehouses.length != 0 && this.selectedStorehouse == null) {
      localStorage.setItem("SelectedStorehouseInPanel", JSON.stringify(this._storehouses[0]));
      localStorage.setItem("colorOfHeader", '#' + this.selectedStorehouse.colorHex.slice(2))
    }
  }

  public saveStorehouseInfoForCreateProductItem(storehouse: Storehouse) {
    localStorage.setItem("StorehouseInfoForCreateProductItem", JSON.stringify(storehouse))
  }

  public getStorehouseInfoForCreateProductItem(): Storehouse {
    let storehouse = localStorage.getItem("StorehouseInfoForCreateProductItem");
    return JSON.parse(storehouse);
  }

  public deleteStorehouseForCreateProductItem() {
    localStorage.removeItem("StorehouseInfoForCreateProductItem");
  }
}