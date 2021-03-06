import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ShareService } from '../../services/share.service';
import { ProductItem } from 'src/app/models/product-item';
import { ProductTypeService } from 'src/app/services/productType.service';
import { StorehouseService } from 'src/app/services/storehouse.service';
import { numberOnlyValidation } from '../../shared/validation';
import { ActivatedRoute } from '@angular/router';
import { ServerConnectionService } from 'src/app/services/server-connection.service';
import { AlertManagerService } from 'src/app/services/alert-manager.service';
import { GenericResponse } from '../../models/generic-response';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import { DatePipe } from '@angular/common'

@Component({
  selector: 'app-product-item-edit',
  templateUrl: './product-item-edit.component.html',
  styleUrls: ['./product-item-edit.component.css']
})
export class ProductItemEditComponent implements OnInit {

  public productItemForm: FormGroup;
  public id:number = 0;
  public productItem = new ProductItem;

  constructor(private fb: FormBuilder,
    private activateRoute: ActivatedRoute,
    public productTypeService: ProductTypeService,
    public storehouseService: StorehouseService,
    private router: Router,
    private shareService: ShareService,
    private server: ServerConnectionService,
    private alertManager: AlertManagerService,
    public datepipe: DatePipe,
    private dateAdapter: DateAdapter<Date>) { }

  ngOnInit(): void 
  {
    this.formEmptyInitialization();
    this.id = this.activateRoute.snapshot.params['id'];
    if (this.id == 0) {
      if ((this.productTypeService.selectedProductTypeForCreateProductItem != null) || (this.storehouseService.selectedStorehouseForCreateProductItem != null)) {
        this.formReconstruction();
      }
      else{
        this.storehouseService.selectedStorehouseForCreateProductItem = this.storehouseService.selectedStorehouseInPanel;
      }
    }
    else{
      this.server.getQuery<GenericResponse<boolean>>('/productitem/' + this.storehouseService.selectedStorehouseInPanel.id
       + '/getproductitem/' + this.id).subscribe(data => {
        if (data.isSuccess) {
          this.productItem = data.data;
          this.formInitialization();
        }
      });
    }
    this.dateAdapter.setLocale("Uk");
  }

  private formEmptyInitialization() {
    this.productItemForm = this.fb.group({
      isOpened: ["false", Validators.required],
      manufactureDate: ['', Validators.required],
      purchaseDate: ['', Validators.required],
      notes: [''],
      amount: [ '', [numberOnlyValidation,Validators.required]],
    });

    var today = new Date();
    this.productItemForm.patchValue({
      manufactureDate:today,
      purchaseDate:today
    });
  }

  private formInitialization() {
    this.productItemForm = this.fb.group({
      isOpened: [String(this.productItem.isOpened), Validators.required],
      manufactureDate: [this.productItem.manufactureDate, Validators.required],
      purchaseDate: [this.productItem.purchaseDate, Validators.required],
      notes: [this.productItem.notes],
      amount: [this.productItem.amount, [numberOnlyValidation,Validators.required]],
    });
  }

  formReconstruction() {
    this.productItemForm = this.fb.group({
      isOpened: [this.shareService.productItemFromForm.isOpened, Validators.required],
      manufactureDate: [this.shareService.productItemFromForm.manufactureDate,Validators.required],
      purchaseDate: [this.shareService.productItemFromForm.purchaseDate, Validators.required],
      notes: [this.shareService.productItemFromForm.notes],
      amount: [this.shareService.productItemFromForm.amount, [numberOnlyValidation,Validators.required]],
    });
  }

  ngOnDestroy(): void {
    this.saveFormInfo();
  }

  saveFormInfo() {
    let productItem: ProductItem = new ProductItem();
    productItem.manufactureDate = this.productItemForm.value.manufactureDate;
    productItem.purchaseDate = this.productItemForm.value.purchaseDate;
    productItem.isOpened = this.productItemForm.value.isOpened;
    productItem.notes = this.productItemForm.value.notes;
    productItem.amount = this.productItemForm.value.amount;
    this.shareService.saveProductItemInfoFromForm(productItem);
  }

  selectProductType() {
    this.router.navigate(['product-type-list/true'])
  }

  selectStorehouse() {
    this.router.navigate(['storehouse-list/true'])
  }

  onSubmit() {
    if(this.id == 0){
      this.productItem.productTypeId = this.productTypeService.selectedProductTypeForCreateProductItem.id;
      this.productItem.newStorehouseId = this.storehouseService.selectedStorehouseForCreateProductItem.id;
    }
    else{
      if(this.storehouseService.selectedStorehouseForCreateProductItem != null){
        this.productItem.newStorehouseId = this.storehouseService.selectedStorehouseForCreateProductItem.id;
      }
      else{
        this.productItem.newStorehouseId = this.storehouseService.selectedStorehouseForCreateProductItem.id;
      }
    }

    this.productItem.isOpened = this.productItemForm.value.isOpened;
    this.productItem.notes = this.productItemForm.value.notes;
    this.productItem.manufactureDate = this.datepipe.transform((this.productItemForm.value.manufactureDate as Date), 'MM-dd-yyyy');
    this.productItem.purchaseDate = this.datepipe.transform((this.productItemForm.value.purchaseDate as Date), 'MM-dd-yyyy');
    this.productItem.amount = this.productItemForm.value.amount;

    if (this.productItemForm.valid) {
      if (this.id != 0) {
        this.update();
      } else {
       this.create();
      }
    }
  }

  private update() {
    this.server.putQuery<GenericResponse<boolean>>('/productitem/' +  this.id,
      this.productItem).subscribe(data => {
        if (data.isSuccess) {
          this.router.navigate(['product-item-list']);
          this.alertManager.showSuccess("Product Item was updated successfully");
        }
        else {
          if(data.error != null){
            this.alertManager.showError(data.error.errorMessage);
          }
          else{
            this.alertManager.showError("Internal Error");
          }
        }
    })
  }

  private create() {
    this.server.postQuery<GenericResponse<boolean>>('/storehouse/' +  this.productItem.newStorehouseId + '/postproductitems',
      this.productItem).subscribe(data => {
      if (data.isSuccess) {
        this.router.navigate(['product-item-list']);
        this.alertManager.showSuccess("Product Item was created successfully");
      }
      else {
        if(data.error != null){
          this.alertManager.showError(data.error.errorMessage);
        }
        else{
          this.alertManager.showError("Internal Error");
        }
      }
    })
  }
}
